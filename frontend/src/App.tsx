import { useState, useEffect } from 'react';
import { ResumeUpload } from './components/ResumeUpload';
import { Dashboard } from './components/Dashboard';
import { Sparkles, Database, ShieldAlert, Cpu } from 'lucide-react';

interface ServerStatus {
  status: string;
  databaseMode: string;
  timestamp: string;
}

function App() {
  const [uploadData, setUploadData] = useState<{ profile: any; matches: any[] } | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [connecting, setConnecting] = useState(true);

  // Poll status endpoint
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/status');
        if (response.ok) {
          const data = await response.json();
          setServerStatus(data);
        } else {
          setServerStatus(null);
        }
      } catch (err) {
        setServerStatus(null);
      } finally {
        setConnecting(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadSuccess = (data: { profile: any; matches: any[] }) => {
    setUploadData(data);
  };

  const handleReset = () => {
    setUploadData(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Decorative Glow Dots */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/45 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                MatchVibe <span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Semantic Resume Matcher</p>
            </div>
          </div>

          {/* Database & Server status badge */}
          <div className="flex items-center gap-2">
            {connecting ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-xxs font-bold rounded-lg animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Connecting to node...
              </div>
            ) : serverStatus ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 text-xxs font-bold rounded-lg">
                  <Database className="w-3.5 h-3.5" />
                  Mode: {serverStatus.databaseMode}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xxs font-bold rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Server Live
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xxs font-bold rounded-lg">
                <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
                Backend Offline
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        {!uploadData ? (
          <div className="flex flex-col items-center">
            {/* Landing Intro */}
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/25 mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Vector-Similarity Semantic Matching
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight mb-4">
                Discover Jobs Structured <br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  Around Your Profile
                </span>
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Upload your resume, and our AI will translate your experience into semantic vector representations, matching you against open careers with complete skill gap explanations.
              </p>
            </div>

            {/* Uploader Component */}
            <ResumeUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Dashboard Title */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-900 pb-5 mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Your AI Career Match Matrix</h2>
                <p className="text-xs text-slate-400 mt-1">Review your parsed qualifications matched with our company database.</p>
              </div>
            </div>

            {/* Dashboard Component */}
            <Dashboard data={uploadData} onReset={handleReset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 py-6 bg-slate-950/25">
        <div className="max-w-7xl mx-auto px-6 text-center text-xxs text-slate-500">
          <p>© 2026 MatchVibe AI Portal. Powered by vector cosine distance scoring.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
