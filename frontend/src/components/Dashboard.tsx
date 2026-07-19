import React, { useState } from 'react';
import { 
  Briefcase, MapPin, DollarSign, Search, ChevronDown, 
  ChevronUp, User, Mail, Phone, GraduationCap, CheckCircle2, AlertTriangle, 
  Sparkles, ExternalLink, Star, RefreshCw 
} from 'lucide-react';
import { ApplicationForm } from './ApplicationForm';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  salary: string;
  job_type: 'Remote' | 'Hybrid' | 'Onsite';
  matchScore: number;
  explanation: {
    matchedSkills: string[];
    missingSkills: string[];
    strengths: string[];
    growthAreas: string[];
  };
}

interface Profile {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

interface DashboardProps {
  data: {
    profile: Profile;
    matches: Job[];
  };
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const { profile, matches } = data;
  const [expandedJobId, setExpandedJobId] = useState<string | null>(matches[0]?.id || null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(30);
  const [locationQuery, setLocationQuery] = useState('');
  const [appliedCount, setAppliedCount] = useState<string[]>([]);
  const [applicationJob, setApplicationJob] = useState<Job | null>(null);

  const toggleJobExpanded = (id: string) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const handleApply = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (!appliedCount.includes(job.id)) setApplicationJob(job);
  };

  const toggleTypeFilter = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Filter Jobs
  const filteredMatches = matches.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = job.location.toLowerCase().includes(locationQuery.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.job_type);
    const matchesScore = job.matchScore >= minScore;
    
    return matchesSearch && matchesLocation && matchesType && matchesScore;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN: Parsed Resume Insights (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{profile.name}</h2>
              <p className="text-xs text-indigo-400 font-medium">Extracted AI Profile</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs text-slate-400 mb-6">
            {profile.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400/80" />
                <span className="truncate">{profile.email}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-indigo-400/80" />
                <span>{profile.phone}</span>
              </div>
            )}
          </div>

          <hr className="border-slate-800/80 mb-6" />

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Professional Summary
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/30">
              {profile.summary}
            </p>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Skills Inventory</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill, i) => (
                <span 
                  key={i} 
                  className="px-2.5 py-1 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 text-xxs font-medium rounded-md border border-indigo-500/10 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Professional Experience & Education */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-200 mb-5 flex items-center gap-2">
            <Briefcase className="w-4.5 h-4.5 text-indigo-400" /> Career History
          </h3>

          <div className="relative border-l-2 border-slate-800 pl-4 ml-2 flex flex-col gap-6">
            {profile.experience && profile.experience.length > 0 ? (
              profile.experience.map((exp, i) => (
                <div key={i} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[23.5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-950"></div>
                  <h4 className="text-xs font-bold text-slate-200">{exp.role}</h4>
                  <p className="text-xxs text-slate-400 font-medium mb-1.5">{exp.company} • {exp.duration}</p>
                  <p className="text-xxs text-slate-400 leading-relaxed line-clamp-2">{exp.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No formal experience found in resume.</p>
            )}
          </div>

          <hr className="border-slate-800/80 my-6" />

          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4.5 h-4.5 text-indigo-400" /> Education
          </h3>
          <div className="flex flex-col gap-4 pl-1">
            {profile.education && profile.education.length > 0 ? (
              profile.education.map((edu, i) => (
                <div key={i}>
                  <h4 className="text-xs font-bold text-slate-200">{edu.degree}</h4>
                  <p className="text-xxs text-slate-400">{edu.institution} {edu.year ? `• Class of ${edu.year}` : ''}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No formal education found in resume.</p>
            )}
          </div>
        </div>

        {/* Reset button to upload again */}
        <button 
          onClick={onReset}
          className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 hover:bg-indigo-500/5 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Upload Another Resume
        </button>
      </div>

      {/* RIGHT COLUMN: Jobs & Matching (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col gap-5">
        
        {/* Search and Filters Section */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Job Title / Company Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              <input 
                type="text"
                placeholder="Search matching job titles or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {/* Location Search */}
            <div className="relative w-full md:w-56">
              <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              <input 
                type="text"
                placeholder="Filter by location..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            {/* Job Type buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xxs font-semibold text-slate-500 uppercase tracking-wider mr-1.5">Job Type:</span>
              {['Remote', 'Hybrid', 'Onsite'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-1.5 text-xxs font-semibold rounded-lg border transition-all ${
                    selectedTypes.includes(type)
                      ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-300'
                      : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Match Score Slider */}
            <div className="flex items-center gap-3 bg-slate-900/40 px-4 py-1.5 rounded-xl border border-slate-850">
              <span className="text-xxs font-semibold text-slate-500 uppercase tracking-wider">Min Match:</span>
              <input 
                type="range" 
                min="10" 
                max="95" 
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
              />
              <span className="text-xxs font-bold text-indigo-400 w-7">{minScore}%</span>
            </div>
          </div>
        </div>

        {/* Matches Header info */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-400 font-medium">
            Showing <span className="text-indigo-400 font-bold">{filteredMatches.length}</span> of {matches.length} matching jobs
          </p>
          <div className="flex items-center gap-1.5 text-xxs font-semibold text-slate-500 uppercase">
            <Star className="w-3.5 h-3.5 text-yellow-500/80 fill-yellow-500/20" /> Sorted by Semantic Relevance
          </div>
        </div>

        {/* Jobs list */}
        {filteredMatches.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredMatches.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const isApplied = appliedCount.includes(job.id);

              // Circular score color maps
              const scoreColor = job.matchScore >= 80 
                ? 'text-emerald-400' 
                : job.matchScore >= 60 
                  ? 'text-indigo-400' 
                  : 'text-amber-400';

              const progressStroke = job.matchScore >= 80
                ? 'stroke-emerald-500'
                : job.matchScore >= 60
                  ? 'stroke-indigo-500'
                  : 'stroke-amber-500';

              return (
                <div 
                  key={job.id}
                  onClick={() => toggleJobExpanded(job.id)}
                  className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'ring-1 ring-indigo-500/20 border-slate-700 bg-slate-900/20' : ''
                  }`}
                >
                  {/* Summary Card Area */}
                  <div className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none">
                    
                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-100 truncate hover:text-indigo-400 transition-colors">
                          {job.title}
                        </h3>
                        <span className={`px-2 py-0.5 text-xxs font-medium rounded-full ${
                          job.job_type === 'Remote' 
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' 
                            : job.job_type === 'Hybrid'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                        }`}>
                          {job.job_type}
                        </span>
                      </div>
                      
                      <p className="text-xs text-indigo-400 font-semibold mb-3">{job.company}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-slate-400 text-xxs">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{job.location}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Match Score Indicator (Radial SVG circle) */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="absolute w-full h-full -rotate-90">
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            className="stroke-slate-800" 
                            strokeWidth="4" 
                            fill="transparent"
                          />
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            className={`${progressStroke} transition-all duration-700`}
                            strokeWidth="4" 
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - job.matchScore / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className={`text-sm font-black ${scoreColor}`}>
                          {job.matchScore}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mt-1">Match</span>
                    </div>

                    {/* Expand Trigger Icon */}
                    <div className="text-slate-500 flex-shrink-0 self-center hover:text-slate-300 p-1.5 bg-slate-900/30 rounded-lg border border-slate-800/40">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expandable Gap Details Area */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-800/60 bg-slate-950/20 transition-all duration-300">
                      
                      {/* Gap Analysis Sections */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-5 border-b border-slate-800/60">
                        
                        {/* Strengths */}
                        <div>
                          <h4 className="text-xxs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Core Alignment Strengths
                          </h4>
                          <ul className="flex flex-col gap-1.5">
                            {job.explanation.strengths.map((str, idx) => (
                              <li key={idx} className="text-xxs text-slate-300 leading-relaxed list-none flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold mt-0.5">•</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Growth Opportunity Gaps */}
                        <div>
                          <h4 className="text-xxs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Gaps & Growth Areas
                          </h4>
                          <ul className="flex flex-col gap-1.5">
                            {job.explanation.growthAreas.map((grow, idx) => (
                              <li key={idx} className="text-xxs text-slate-300 leading-relaxed list-none flex items-start gap-1.5">
                                <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                <span>{grow}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Technical Skill Badges Grid */}
                      <div className="py-4 border-b border-slate-800/60">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Matched Skills */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Matched Skills ({job.explanation.matchedSkills.length})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {job.explanation.matchedSkills.map((sk, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xxs font-semibold rounded-md">
                                  {sk}
                                </span>
                              ))}
                              {job.explanation.matchedSkills.length === 0 && (
                                <span className="text-xxs text-slate-500 italic">None matched</span>
                              )}
                            </div>
                          </div>

                          {/* Missing Skills */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Missing Skills ({job.explanation.missingSkills.length})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {job.explanation.missingSkills.map((sk, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xxs font-semibold rounded-md">
                                  {sk}
                                </span>
                              ))}
                              {job.explanation.missingSkills.length === 0 && (
                                <span className="text-xxs text-emerald-400 font-medium">No missing skills!</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Job Description details */}
                      <div className="py-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">About the Role</span>
                        <p className="text-xxs text-slate-400 leading-relaxed">{job.description}</p>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 flex justify-end gap-3">
                        <button 
                          onClick={(e) => handleApply(e, job)}
                          className={`glow-btn px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                            isApplied 
                              ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700/60'
                              : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-indigo-500/10'
                          }`}
                        >
                          {isApplied ? 'Application Sent' : 'Easy Apply'} <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-200 mb-1">No Matching Jobs Found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Try adjusting your sliders or filtering options to display jobs that fit your profile.
            </p>
          </div>
        )}
      </div>
      {applicationJob && (
        <ApplicationForm
          job={applicationJob}
          profile={profile}
          onClose={() => setApplicationJob(null)}
          onSubmitted={() => setAppliedCount(current => [...current, applicationJob.id])}
        />
      )}
    </div>
  );
};
