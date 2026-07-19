"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const MOCK_DB_PATH = path.join(__dirname, '../../mock_db.json');
class DatabaseService {
    pool = null;
    useFallback = true;
    fallbackData = { jobs: [], resumes: [] };
    constructor() {
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
            this.pool = new pg_1.Pool({
                connectionString: dbUrl,
                connectionTimeoutMillis: 5000,
            });
        }
    }
    isUsingFallback() {
        return this.useFallback;
    }
    // Load fallback data from JSON
    loadFallback() {
        try {
            if (fs.existsSync(MOCK_DB_PATH)) {
                const fileContent = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
                this.fallbackData = JSON.parse(fileContent);
            }
            else {
                this.fallbackData = { jobs: [], resumes: [] };
                this.saveFallback();
            }
        }
        catch (error) {
            console.error('Error loading fallback JSON database:', error);
            this.fallbackData = { jobs: [], resumes: [] };
        }
    }
    // Save fallback data to JSON
    saveFallback() {
        try {
            const dir = path.dirname(MOCK_DB_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(this.fallbackData, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Error writing fallback JSON database:', error);
        }
    }
    // Initialize DB tables
    async initDb() {
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
            }
            catch (err) {
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
            client.release();
            this.useFallback = false;
            console.log('✅ PostgreSQL Schema initialized successfully.');
        }
        catch (error) {
            console.error('⚠️ PostgreSQL connection failed. Falling back to Local Mock Mode.');
            console.error('Error info:', error.message);
            this.useFallback = true;
            this.loadFallback();
        }
    }
    // Get all jobs
    async getJobs() {
        if (this.useFallback) {
            return this.fallbackData.jobs;
        }
        try {
            const res = await this.pool.query('SELECT id, title, company, description, requirements, location, salary, job_type, job_embeddings::text as job_embeddings FROM jobs');
            return res.rows.map(row => ({
                ...row,
                requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements,
                job_embeddings: row.job_embeddings ? row.job_embeddings.replace('[', '').replace(']', '').split(',').map(Number) : undefined
            }));
        }
        catch (error) {
            console.error('Error fetching jobs from PG:', error);
            return this.fallbackData.jobs; // emergency fallback
        }
    }
    // Save a job
    async saveJob(job) {
        const id = job.id || Math.random().toString(36).substring(2, 11);
        const newJob = { ...job, id };
        if (this.useFallback) {
            // Check if job already exists to avoid duplicates during multiple seeds
            const index = this.fallbackData.jobs.findIndex(j => j.title === job.title && j.company === job.company);
            if (index > -1) {
                this.fallbackData.jobs[index] = newJob;
            }
            else {
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
            const res = await this.pool.query(queryText, values);
            return { ...newJob, id: res.rows[0].id };
        }
        catch (error) {
            console.error('Error saving job to PG:', error);
            // Fallback
            this.fallbackData.jobs.push(newJob);
            this.saveFallback();
            return newJob;
        }
    }
    // Save a resume
    async saveResume(resume) {
        const id = Math.random().toString(36).substring(2, 11);
        const newResume = { ...resume, id };
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
            const res = await this.pool.query(queryText, values);
            return { ...newResume, id: res.rows[0].id };
        }
        catch (error) {
            console.error('Error saving resume to PG:', error);
            this.fallbackData.resumes.push(newResume);
            this.saveFallback();
            return newResume;
        }
    }
    // DB Direct query access if needed
    async query(text, params) {
        if (this.useFallback) {
            throw new Error('Database is in fallback mode. Custom SQL queries are disabled.');
        }
        return this.pool.query(text, params);
    }
}
exports.db = new DatabaseService();
exports.default = exports.db;
