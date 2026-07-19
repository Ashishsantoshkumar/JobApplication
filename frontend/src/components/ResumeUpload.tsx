import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface ResumeUploadProps {
  onUploadSuccess: (data: { profile: any; matches: any[] }) => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingSteps = [
    'Uploading document to secure portal...',
    'Extracting raw PDF text content...',
    'Analyzing skills and experiences via LLM...',
    'Calculating vector embeddings & similarity scores...',
    'Ranking available opportunities...'
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Run the sequence of loading messages to make the UI interactive
  const startLoadingAnimation = async () => {
    setLoading(true);
    setError(null);
    for (let i = 0; i < loadingSteps.length; i++) {
      setLoadingStep(i);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Invalid file format. Please upload a PDF document.');
      return;
    }

    try {
      // Start simulated phases on UI first
      const animPromise = startLoadingAnimation();

      const formData = new FormData();
      formData.append('resume', file);

      // Perform actual request
      const response = await fetch('http://localhost:5000/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to parse resume');
      }

      const result = await response.json();
      
      // Wait for animation to catch up if request is super fast
      await animPromise;
      
      onUploadSuccess(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while uploading your resume. Please try again.');
      setLoading(false);
    }
  };



  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Dynamic Uploader Card */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass-card p-10 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
          isDragging 
            ? 'border-indigo-400 bg-indigo-950/20 scale-[1.01]' 
            : 'border-slate-700 hover:border-slate-500'
        } ${loading ? 'pointer-events-none' : ''}`}
        onClick={triggerFileInput}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />

        {loading ? (
          <div className="flex flex-col items-center py-6">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Analyzing Resume</h3>
            <p className="text-slate-400 text-sm animate-pulse max-w-sm">
              {loadingSteps[loadingStep]}
            </p>
            <div className="w-64 bg-slate-800 h-1.5 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-indigo-400" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-100 mb-2">Upload your resume</h3>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              Drag and drop your PDF resume here, or click to browse files.
            </p>
            <button className="glow-btn bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
              Select PDF File <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 mt-4">Supported format: PDF (Max 10MB)</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}


    </div>
  );
};
