"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankJobsForResume = rankJobsForResume;
const db_1 = require("./db");
// Cosine similarity in JS (used for mock DB fallback)
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0)
        return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
// Generate the text breakdown for matching / missing items
function generateExplanation(resume, job) {
    const resumeSkills = (resume.parsed_json.skills || []).map(s => s.toLowerCase());
    const jobRequirements = (job.requirements || []).map(r => r.toLowerCase());
    const matchedSkills = [];
    const missingSkills = [];
    // Look for direct or partial skill matches
    job.requirements.forEach(req => {
        const reqLower = req.toLowerCase();
        const isMatched = resumeSkills.some(skill => skill.includes(reqLower) || reqLower.includes(skill));
        if (isMatched) {
            matchedSkills.push(req);
        }
        else {
            missingSkills.push(req);
        }
    });
    // Strengths based on resume match
    const strengths = [];
    if (matchedSkills.length > 0) {
        strengths.push(`Matches critical technical requirements: ${matchedSkills.slice(0, 3).join(', ')}.`);
    }
    const experienceYearsMatch = resume.extracted_text.match(/(\d+)\+?\s*years?\s+of\s+experience/i) ||
        resume.extracted_text.match(/experience\s*:\s*(\d+)\+?\s*years?/i);
    if (experienceYearsMatch) {
        strengths.push(`Demonstrated tenure with ${experienceYearsMatch[0]}.`);
    }
    else {
        // Check if we have multiple experience entries
        const expCount = resume.parsed_json.experience?.length || 0;
        if (expCount >= 2) {
            strengths.push(`Solid work history showing career progress across ${expCount} roles.`);
        }
    }
    // Growth / Missing areas
    const growthAreas = [];
    if (missingSkills.length > 0) {
        growthAreas.push(`Skill development opportunity in: ${missingSkills.slice(0, 2).join(', ')}.`);
    }
    else {
        growthAreas.push(`Fully aligned with the role's primary technical keywords.`);
    }
    return {
        matchedSkills,
        missingSkills,
        strengths,
        growthAreas
    };
}
async function rankJobsForResume(resumeId) {
    const allJobs = await db_1.db.getJobs();
    const targetResume = await db_1.db.getResume(resumeId);
    if (!targetResume) {
        throw new Error(`Resume with ID ${resumeId} not found.`);
    }
    const matchedJobs = [];
    // If using PostgreSQL and pgvector, we can run a SQL cosine similarity query
    if (!db_1.db.isUsingFallback() && targetResume.resume_embeddings) {
        try {
            const embeddingStr = `[${targetResume.resume_embeddings.join(',')}]`;
            // Cosine similarity in pgvector is 1 - (vector1 <=> vector2)
            const res = await db_1.db.query(`
        SELECT id, title, company, description, requirements, location, salary, job_type, 
               (1 - (job_embeddings <=> $1)) as similarity
        FROM jobs
        ORDER BY similarity DESC
      `, [embeddingStr]);
            for (const row of res.rows) {
                const job = {
                    id: row.id,
                    title: row.title,
                    company: row.company,
                    description: row.description,
                    requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements,
                    location: row.location,
                    salary: row.salary,
                    job_type: row.job_type
                };
                const similarity = row.similarity !== null ? Number(row.similarity) : 0.5;
                // Map similarity (ranges from -1 to 1, usually 0 to 1 for non-negative terms) to 0-100 percentage.
                // For text-embedding-3-small, similarity values are typically between 0.2 and 0.8.
                // We can scale it to look nice: similarity * 100 or a calibrated scaling.
                const scaledScore = Math.min(100, Math.max(0, Math.round(similarity * 100)));
                matchedJobs.push({
                    ...job,
                    matchScore: scaledScore,
                    explanation: generateExplanation(targetResume, job)
                });
            }
            // Return sorted by match score descending
            return matchedJobs.sort((a, b) => b.matchScore - a.matchScore);
        }
        catch (err) {
            console.error('Failed to run pgvector query, falling back to JS matching:', err);
        }
    }
    // Fallback / local matching: Cosine similarity in JS
    const resumeVector = targetResume.resume_embeddings;
    for (const job of allJobs) {
        let similarity = 0.5; // baseline
        if (resumeVector && job.job_embeddings) {
            similarity = cosineSimilarity(resumeVector, job.job_embeddings);
        }
        else {
            // String keyword similarity fallback if embeddings are missing
            const resumeText = (targetResume.extracted_text + ' ' + (targetResume.parsed_json.skills || []).join(' ')).toLowerCase();
            const jobText = (job.title + ' ' + job.description + ' ' + (job.requirements || []).join(' ')).toLowerCase();
            // Count overlap of keywords
            const jobWords = Array.from(new Set(jobText.split(/\W+/).filter(w => w.length > 2)));
            let matches = 0;
            jobWords.forEach(word => {
                if (resumeText.includes(word)) {
                    matches++;
                }
            });
            similarity = jobWords.length > 0 ? (matches / jobWords.length) : 0.5;
        }
        // Scale to percentage (e.g. 0.3 -> 65%, 0.7 -> 95%, etc. using a sigmoid or linear map to look realistic)
        // Cosine similarity of text embeddings usually falls between 0.3 and 0.8
        let scaledScore = 50; // default
        if (resumeVector && job.job_embeddings) {
            // Map range [0.1, 0.7] to [40, 99]
            scaledScore = Math.round(40 + (similarity - 0.1) * (59 / 0.6));
        }
        else {
            // keyword based
            scaledScore = Math.round(30 + similarity * 70);
        }
        scaledScore = Math.min(99, Math.max(10, scaledScore));
        matchedJobs.push({
            ...job,
            matchScore: scaledScore,
            explanation: generateExplanation(targetResume, job)
        });
    }
    return matchedJobs.sort((a, b) => b.matchScore - a.matchScore);
}
