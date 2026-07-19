import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, LoaderCircle, Send, X } from 'lucide-react';
import { API_BASE } from '../config';

interface ApplicationFormProps {
  job: { id: string; title: string; company: string };
  profile: { name?: string; email?: string; phone?: string };
  onClose: () => void;
  onSubmitted: () => void;
}

export const ApplicationForm = ({ job, profile, onClose, onSubmitted }: ApplicationFormProps) => {
  const [form, setForm] = useState({
    full_name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    linkedin_url: '',
    cover_letter: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, ...form })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit your application.');
      }

      setSubmitted(true);
      onSubmitted();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="application-title">
      <button className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" aria-label="Close application form" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Application submitted</h2>
            <p className="mt-2 text-sm text-slate-400">Your application for {job.title} at {job.company} has been saved.</p>
            <button onClick={onClose} className="mt-6 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600">Done</button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Easy Apply</p>
            <h2 id="application-title" className="mt-1 pr-8 text-xl font-bold text-white">{job.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{job.company}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-300">Full name
                  <input required value={form.full_name} onChange={event => updateField('full_name', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
                </label>
                <label className="text-xs font-medium text-slate-300">Email address
                  <input required type="email" value={form.email} onChange={event => updateField('email', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-300">Phone number
                  <input value={form.phone} onChange={event => updateField('phone', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
                </label>
                <label className="text-xs font-medium text-slate-300">LinkedIn URL
                  <input type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={event => updateField('linkedin_url', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
                </label>
              </div>
              <label className="block text-xs font-medium text-slate-300">Why are you a good fit? <span className="text-slate-500">(optional)</span>
                <textarea rows={4} value={form.cover_letter} onChange={event => updateField('cover_letter', event.target.value)} className="mt-1.5 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" placeholder="Briefly introduce yourself and your interest in this role." />
              </label>
              {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800">Cancel</button>
                <button disabled={submitting} type="submit" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
