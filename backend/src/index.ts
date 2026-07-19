import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { db } from './services/db';
import { parseResume } from './services/parser';
import { getEmbedding } from './services/embedding';
import { rankJobsForResume } from './services/match';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
// Initialize once per function instance. Requests wait for this promise before
// accessing the database, which also makes cold starts safe on Vercel.
const databaseReady = db.initDb();

// Middleware
app.use(cors());
app.use(express.json());
app.use(async (_req, _res, next) => {
  try {
    await databaseReady;
    next();
  } catch (error) {
    next(error);
  }
});

// Configure multer for file upload in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resumes are supported in this version.'));
    }
  }
});

// Server status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    databaseMode: db.isUsingFallback() ? 'Local JSON Mock' : 'PostgreSQL + pgvector',
    timestamp: new Date().toISOString()
  });
});

// Get all jobs list
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await db.getJobs();
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /api/jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Create a new job listing
app.post('/api/jobs', async (req, res) => {
  try {
    const { title, company, description, requirements, location, salary, job_type } = req.body;
    
    if (!title || !company || !description || !location) {
      return res.status(400).json({ error: 'Missing required job parameters.' });
    }

    // Generate job embeddings from title, description, and requirements
    const requirementsText = Array.isArray(requirements) ? requirements.join(', ') : '';
    const textToEmbed = `${title} at ${company}. ${description}. Requirements: ${requirementsText}`;
    
    console.log(`Generating embedding for new job: "${title} - ${company}"`);
    const job_embeddings = await getEmbedding(textToEmbed);

    const newJob = await db.saveJob({
      title,
      company,
      description,
      requirements: Array.isArray(requirements) ? requirements : [],
      location,
      salary: salary || 'Not Specified',
      job_type: job_type || 'Remote',
      job_embeddings
    });

    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error in POST /api/jobs:', error);
    res.status(500).json({ error: 'Failed to create job listing' });
  }
});

// Submit an application for a matched job
app.post('/api/applications', async (req, res) => {
  try {
    const {
      job_id,
      full_name,
      email,
      phone,
      current_location,
      years_experience,
      current_company,
      notice_period,
      expected_salary,
      linkedin_url,
      portfolio_url,
      cover_letter
    } = req.body;

    if (!job_id || !full_name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Job, full name, and email are required.' });
    }

    const application = await db.saveApplication({
      job_id,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      current_location: current_location?.trim() || 'Not specified',
      years_experience: Number.isFinite(Number(years_experience)) ? Number(years_experience) : 0,
      current_company: current_company?.trim(),
      notice_period: notice_period?.trim() || 'Not specified',
      expected_salary: expected_salary?.trim(),
      linkedin_url: linkedin_url?.trim(),
      portfolio_url: portfolio_url?.trim(),
      cover_letter: cover_letter?.trim()
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Error in POST /api/applications:', error);
    res.status(500).json({ error: 'Unable to submit the application. Please try again.' });
  }
});

// Upload resume and rank matching jobs
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    console.log(`Received file: ${req.file.originalname} (${req.file.size} bytes)`);

    // 1. Parse resume text & structure
    const { rawText, parsedJson } = await parseResume(req.file.buffer);

    // 2. Generate embedding for resume
    // Combine summary and skills for rich semantic context
    const skillsStr = (parsedJson.skills || []).join(', ');
    const experienceRoles = (parsedJson.experience || []).map(exp => exp.role).join(', ');
    const textToEmbed = `${parsedJson.summary || ''}. Skills: ${skillsStr}. Experience roles: ${experienceRoles}. ${rawText}`;
    
    console.log('Generating embedding for resume profile...');
    const resume_embeddings = await getEmbedding(textToEmbed);

    // 3. Save resume to DB
    const savedResume = await db.saveResume({
      extracted_text: rawText,
      parsed_json: parsedJson,
      resume_embeddings
    });

    console.log(`Resume saved. ID: ${savedResume.id}. Ranking jobs...`);

    // 4. Rank matching jobs using embeddings
    const matchedJobs = await rankJobsForResume(savedResume.id);

    res.json({
      resumeId: savedResume.id,
      profile: parsedJson,
      matches: matchedJobs
    });
  } catch (error) {
    console.error('Error in POST /api/resume/upload:', error);
    res.status(500).json({ error: (error as Error).message || 'Failed to process resume' });
  }
});

// Initialize database schemas and start server
async function startServer() {
  app.listen(port, () => {
    console.log(`🚀 Resume-to-Job Matching Server running on http://localhost:${port}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled request error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
