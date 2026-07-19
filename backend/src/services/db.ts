import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Define structures
export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[]; // parsed array of requirements
  location: string;
  salary: string;
  job_type: 'Remote' | 'Hybrid' | 'Onsite';
  job_embeddings?: number[];
}

export interface Resume {
  id: string;
  extracted_text: string;
  parsed_json: {
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    skills?: string[];
    experience?: Array<{
      role?: string;
      company?: string;
      duration?: string;
      description?: string;
    }>;
    education?: Array<{
      degree?: string;
      institution?: string;
      year?: string;
    }>;
  };
  resume_embeddings?: number[];
}

export interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone?: string;
  current_location: string;
  years_experience: number;
  current_company?: string;
  notice_period: string;
  expected_salary?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  cover_letter?: string;
  created_at: string;
}

const MOCK_DB_PATH = path.join(__dirname, '../../mock_db.json');

class DatabaseService {
  private pool: Pool | null = null;
  private useFallback: boolean = true;
  private fallbackData: { jobs: Job[]; resumes: Resume[]; applications: Application[] } = {
    jobs: [],
    resumes: [],
    applications: []
  };

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      this.pool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 5000,
      });
    }
  }

  public isUsingFallback(): boolean {
    return this.useFallback;
  }

  // Load fallback data from JSON
  private loadFallback() {
    try {
      if (fs.existsSync(MOCK_DB_PATH)) {
        const fileContent = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
        const storedData = JSON.parse(fileContent);
        this.fallbackData = {
          jobs: storedData.jobs || [],
          resumes: storedData.resumes || [],
          applications: storedData.applications || []
        };
      } else {
        this.fallbackData = { jobs: [], resumes: [], applications: [] };
        this.saveFallback();
      }
    } catch (error) {
      console.error('Error loading fallback JSON database:', error);
      this.fallbackData = { jobs: [], resumes: [], applications: [] };
    }
  }

  // Save fallback data to JSON
  private saveFallback() {
    try {
      const dir = path.dirname(MOCK_DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(this.fallbackData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing fallback JSON database:', error);
    }
  }

  // Initialize DB tables
  public async initDb(): Promise<void> {
    if (!this.pool) {
      console.log('⚡ DATABASE_URL not set. Running in Local Mock Mode.');
      this.useFallback = true;
      this.loadFallback();
      return;
    }

    try {
      // Test the database connection
      const client = await this.pool.connect();
      console.log('🐘 PostgreSQL connected. Verifying schema...');
      
      // Create vector extension if exists (must be superuser, or already enabled)
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      } catch (err) {
        console.warn('⚠️ Warning: Could not create pgvector extension. Make sure it is installed on the PG server.');
      }

      // Create Jobs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          requirements JSONB DEFAULT '[]'::jsonb,
          location VARCHAR(255) NOT NULL,
          salary VARCHAR(100),
          job_type VARCHAR(50) DEFAULT 'Remote',
          job_embeddings vector(1536)
        );
      `);

      // Create Resumes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS resumes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          extracted_text TEXT NOT NULL,
          parsed_json JSONB DEFAULT '{}'::jsonb,
          resume_embeddings vector(1536)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          current_location VARCHAR(255) NOT NULL,
          years_experience NUMERIC(4, 1) NOT NULL,
          current_company VARCHAR(255),
          notice_period VARCHAR(100) NOT NULL,
          expected_salary VARCHAR(100),
          linkedin_url TEXT,
          portfolio_url TEXT,
          cover_letter TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        ALTER TABLE applications
          ADD COLUMN IF NOT EXISTS current_location VARCHAR(255),
          ADD COLUMN IF NOT EXISTS years_experience NUMERIC(4, 1),
          ADD COLUMN IF NOT EXISTS current_company VARCHAR(255),
          ADD COLUMN IF NOT EXISTS notice_period VARCHAR(100),
          ADD COLUMN IF NOT EXISTS expected_salary VARCHAR(100),
          ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
      `);

      client.release();
      this.useFallback = false;
      console.log('✅ PostgreSQL Schema initialized successfully.');
    } catch (error) {
      console.error('⚠️ PostgreSQL connection failed. Falling back to Local Mock Mode.');
      console.error('Error info:', (error as Error).message);
      this.useFallback = true;
      this.loadFallback();
    }
  }

  // Get all jobs
  public async getJobs(): Promise<Job[]> {
    if (this.useFallback) {
      return this.fallbackData.jobs;
    }

    try {
      const res = await this.pool!.query('SELECT id, title, company, description, requirements, location, salary, job_type, job_embeddings::text as job_embeddings FROM jobs');
      return res.rows.map(row => ({
        ...row,
        requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements,
        job_embeddings: row.job_embeddings ? row.job_embeddings.replace('[', '').replace(']', '').split(',').map(Number) : undefined
      }));
    } catch (error) {
      console.error('Error fetching jobs from PG:', error);
      return this.fallbackData.jobs; // emergency fallback
    }
  }

  // Save a job
  public async saveJob(job: Omit<Job, 'id'> & { id?: string }): Promise<Job> {
    const id = job.id || Math.random().toString(36).substring(2, 11);
    const newJob: Job = { ...job, id };

    if (this.useFallback) {
      // Check if job already exists to avoid duplicates during multiple seeds
      const index = this.fallbackData.jobs.findIndex(j => j.title === job.title && j.company === job.company);
      if (index > -1) {
        this.fallbackData.jobs[index] = newJob;
      } else {
        this.fallbackData.jobs.push(newJob);
      }
      this.saveFallback();
      return newJob;
    }

    try {
      let embeddingStr = null;
      if (job.job_embeddings) {
        embeddingStr = `[${job.job_embeddings.join(',')}]`;
      }

      const queryText = `
        INSERT INTO jobs (title, company, description, requirements, location, salary, job_type, job_embeddings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      const values = [
        job.title,
        job.company,
        job.description,
        JSON.stringify(job.requirements),
        job.location,
        job.salary,
        job.job_type,
        embeddingStr
      ];

      const res = await this.pool!.query(queryText, values);
      return { ...newJob, id: res.rows[0].id };
    } catch (error) {
      console.error('Error saving job to PG:', error);
      // Fallback
      this.fallbackData.jobs.push(newJob);
      this.saveFallback();
      return newJob;
    }
  }

  // Save a resume
  public async saveResume(resume: Omit<Resume, 'id'>): Promise<Resume> {
    const id = Math.random().toString(36).substring(2, 11);
    const newResume: Resume = { ...resume, id };

    if (this.useFallback) {
      this.fallbackData.resumes.push(newResume);
      this.saveFallback();
      return newResume;
    }

    try {
      let embeddingStr = null;
      if (resume.resume_embeddings) {
        embeddingStr = `[${resume.resume_embeddings.join(',')}]`;
      }

      const queryText = `
        INSERT INTO resumes (extracted_text, parsed_json, resume_embeddings)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const values = [
        resume.extracted_text,
        JSON.stringify(resume.parsed_json),
        embeddingStr
      ];

      const res = await this.pool!.query(queryText, values);
      return { ...newResume, id: res.rows[0].id };
    } catch (error) {
      console.error('Error saving resume to PG:', error);
      this.fallbackData.resumes.push(newResume);
      this.saveFallback();
      return newResume;
    }
  }

  public async saveApplication(application: Omit<Application, 'id' | 'created_at'>): Promise<Application> {
    const fallbackApplication: Application = {
      ...application,
      id: Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString()
    };

    if (this.useFallback) {
      this.fallbackData.applications.push(fallbackApplication);
      this.saveFallback();
      return fallbackApplication;
    }

    const result = await this.pool!.query(
      `INSERT INTO applications (job_id, full_name, email, phone, current_location, years_experience, current_company, notice_period, expected_salary, linkedin_url, portfolio_url, cover_letter)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        application.job_id,
        application.full_name,
        application.email,
        application.phone || null,
        application.current_location,
        application.years_experience,
        application.current_company || null,
        application.notice_period,
        application.expected_salary || null,
        application.linkedin_url || null,
        application.portfolio_url || null,
        application.cover_letter || null
      ]
    );

    return result.rows[0];
  }

  // DB Direct query access if needed
  public async query(text: string, params?: any[]): Promise<any> {
    if (this.useFallback) {
      throw new Error('Database is in fallback mode. Custom SQL queries are disabled.');
    }
    return this.pool!.query(text, params);
  }
}

export const db = new DatabaseService();
export default db;
