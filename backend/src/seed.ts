import dotenv from 'dotenv';
import { db, Job } from './services/db';
import { getEmbedding } from './services/embedding';

dotenv.config();

const sampleJobs: Omit<Job, 'id'>[] = [
  {
    title: 'Senior React Developer',
    company: 'Skyward Software Corp',
    description: 'Looking for a Senior React Engineer to lead the development of our enterprise SaaS dashboards. You will work closely with designers to build premium interfaces.',
    requirements: ['React', 'TypeScript', 'Redux', 'Tailwind', 'Git', 'CSS', 'JavaScript'],
    location: 'Remote',
    salary: '$130,000 - $160,000',
    job_type: 'Remote'
  },
  {
    title: 'Backend Engineer (Node/Postgres)',
    company: 'DataFlow Systems',
    description: 'Join our backend systems team to design, build, and maintain high-throughput REST APIs and vector databases. Experience scaling Node.js apps is a must.',
    requirements: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'SQL', 'Git', 'AWS'],
    location: 'San Francisco, CA',
    salary: '$140,000 - $175,000',
    job_type: 'Hybrid'
  },
  {
    title: 'AI/Python Developer',
    company: 'NeuraMind AI',
    description: 'Develop next-generation AI agents and large language model matching parsers. You will build clean microservices and configure pipelines using FastAPI and Python.',
    requirements: ['Python', 'FastAPI', 'OpenAI', 'Git', 'Docker', 'SQL'],
    location: 'New York, NY',
    salary: '$150,000 - $190,000',
    job_type: 'Onsite'
  },
  {
    title: 'UX/UI Designer',
    company: 'PixelPerfect Designs',
    description: 'Seeking a creative UX/UI designer to build design languages, wireframes, and frontends. Must understand user journeys and be capable of writing HTML/CSS prototypes.',
    requirements: ['Design', 'Figma', 'HTML', 'CSS', 'Tailwind'],
    location: 'Remote',
    salary: '$95,000 - $120,000',
    job_type: 'Remote'
  },
  {
    title: 'DevOps Cloud Engineer',
    company: 'CloudScale Technologies',
    description: 'Responsible for maintaining our AWS cloud infrastructure, CI/CD deployment pipelines, containerization clusters, and server monitoring suites.',
    requirements: ['AWS', 'Docker', 'Kubernetes', 'Git', 'Terraform'],
    location: 'Seattle, WA',
    salary: '$145,000 - $180,000',
    job_type: 'Hybrid'
  },
  {
    title: 'Junior Frontend Engineer',
    company: 'Launchpad Startups',
    description: 'Entry-level role for a developer looking to grow. Assist in building responsive landing pages and modular React widgets in a fast-paced environment.',
    requirements: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    location: 'Austin, TX',
    salary: '$70,000 - $90,000',
    job_type: 'Onsite'
  },
  {
    title: 'Technical Product Manager',
    company: 'Vanguard Systems',
    description: 'Bridge the gap between product strategy and engineering execution. Write detailed user stories, lead scrum rituals, and outline release roadmaps.',
    requirements: ['Manager', 'Agile', 'Scrum', 'Jira', 'Git'],
    location: 'Remote',
    salary: '$120,000 - $150,000',
    job_type: 'Remote'
  },
  {
    title: 'Talent Acquisition / HR Manager',
    company: 'Skyward Software Corp',
    description: 'Manage full-cycle technical recruiting, developer onboarding pipelines, employee engagement, and employee satisfaction initiatives.',
    requirements: ['Manager', 'HR', 'Recruiting', 'Communication'],
    location: 'Denver, CO',
    salary: '$85,000 - $105,000',
    job_type: 'Hybrid'
  },
  {
    title: 'Growth Marketing Coordinator',
    company: 'Audience Amplified',
    description: 'Drive user acquisition and conversion. Run campaigns on search networks, analyze web analytics dashboards, and craft email copywriting drafts.',
    requirements: ['SEO', 'Marketing', 'Google Analytics', 'Design'],
    location: 'Remote',
    salary: '$65,000 - $80,000',
    job_type: 'Remote'
  },
  {
    title: 'Data Analyst',
    company: 'Metrics Matter Co.',
    description: 'Analyze complex datasets to deliver business insights. Build analytics dashboards and construct advanced queries for engineering research.',
    requirements: ['SQL', 'Python', 'Tableau', 'Excel'],
    location: 'Chicago, IL',
    salary: '$80,000 - $110,000',
    job_type: 'Hybrid'
  }
];

async function seed() {
  console.log('🌱 Starting Job Database Seeding...');
  await db.initDb();

  for (const job of sampleJobs) {
    try {
      const requirementsText = job.requirements.join(', ');
      const textToEmbed = `${job.title} at ${job.company}. ${job.description}. Requirements: ${requirementsText}`;
      
      console.log(`Generating embedding & saving job: "${job.title} - ${job.company}"`);
      const job_embeddings = await getEmbedding(textToEmbed);
      
      await db.saveJob({
        ...job,
        job_embeddings
      });
    } catch (error) {
      console.error(`❌ Failed to seed job: "${job.title}"`, error);
    }
  }

  console.log('✅ Seeding completed successfully!');
  process.exit(0);
}

seed();
