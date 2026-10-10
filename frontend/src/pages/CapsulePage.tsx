import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Sparkles, Check } from 'lucide-react';
import { capsuleApi } from '@/api';
import { useAuthStore } from '@/store';
import { getDaysUntil } from '@/utils';
import type { CapsuleEntry } from '@/types';

const PROMPTS = [
  'Letter to My Future Self',
  'Message to the Group',
  'Where do you see yourself in 5 years?',
  'Favorite Memory So Far',
];

const INK_COLORS = [
  { name: 'Charcoal Coffee', hex: '#2b2623' },
  { name: 'Roasted Copper', hex: '#bd532b' },
  { name: 'Eucalyptus Sage', hex: '#6b7f6a' },
];

export default function CapsulePage() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'curator');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [selectedPrompt, setSelectedPrompt] = useState(PROMPTS[0]);
  const [message, setMessage] = useState('');
  const [selectedInk, setSelectedInk] = useState('#2b2623');
  const [isRevealed, setIsRevealed] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const { data: statusData } = useQuery({
    queryKey: ['capsule-status'],
    queryFn: () => capsuleApi.getStatus(),
  });

  const { data: entriesData } = useQuery({
    queryKey: ['capsule-entries'],
    queryFn: () => capsuleApi.list(),
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: capsuleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capsule-entries'] });
      setMessage('');
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
    },
  });

  const entries: CapsuleEntry[] = entriesData?.data || [];
  const revealDate = statusData?.data?.reveal_date || '2027-05-15';
  const revealYear = new Date(revealDate).getFullYear();
  const daysUntil = getDaysUntil(revealDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    createMutation.mutate({
      prompt: selectedPrompt,
      message: message.trim(),
      ink_color: selectedInk,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto border-b border-sa-border pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sa-accent/10 text-sa-accent text-xs font-handwriting text-base">
          <Lock className="w-3.5 h-3.5" />
          <span>Sealed Vault • Opens on Reveal Day</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-normal text-sa-text font-serif-title">
          Time Capsule
        </h1>
        <p className="text-xs sm:text-sm text-sa-text-muted leading-relaxed">
          Write a signed letter to your future self or leave a note for the group. Sealed until reveal day.
        </p>
      </div>

      {/* Countdown */}
      <div className="bg-[#fffdf9] border border-sa-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs text-sa-accent font-handwriting text-lg">Reveal Ceremony</span>
          <div className="text-xl font-bold text-sa-text font-serif-title">{revealYear} Vault Unlock</div>
        </div>

        <div className="flex gap-3 text-center">
          {[
            { num: String(Math.floor(daysUntil / 30)).padStart(2, '0'), unit: 'MONTHS' },
            { num: String(daysUntil % 30).padStart(2, '0'), unit: 'DAYS' },
            { num: '14', unit: 'HOURS' },
            { num: '32', unit: 'MINS' },
          ].map((t, idx) => (
            <div key={idx} className="bg-[#efe8da] border border-[#e2d7c5] px-3.5 py-2 rounded-2xl min-w-[64px]">
              <div className="text-xl font-bold text-sa-accent font-serif-title">{t.num}</div>
              <div className="text-[9px] text-sa-text-dim font-semibold">{t.unit}</div>
            </div>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="bg-[#efe8da] hover:bg-[#e6decb] text-sa-accent border border-[#e2d7c5] px-4 py-2 rounded-2xl text-xs font-semibold transition"
          >
            {isRevealed ? 'Re-Seal Vault' : 'Test Ceremonial Reveal'}
          </button>
        )}
      </div>

      {/* Compose Form */}
      {isAuthenticated && (
        <div className="bg-[#fffdf9] border border-sa-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-sa-border pb-4">
            <Sparkles className="w-5 h-5 text-sa-accent" />
            <h2 className="text-lg font-bold text-sa-text font-serif-title">Deposit Capsule Letter</h2>
          </div>

          {submittedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Letter sealed and added to the time capsule!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-sa-text-muted mb-1.5 font-medium">Your Name</label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-[#f8f4ea] border border-sa-border rounded-2xl px-4 py-2.5 text-xs text-sa-text focus:outline-none focus:border-sa-accent"
              />
            </div>

            <div>
              <label className="block text-xs text-sa-text-muted mb-1.5 font-medium">Select Letter Topic</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPTS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setSelectedPrompt(p)}
                    className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium text-left transition ${
                      selectedPrompt === p
                        ? 'bg-sa-accent text-white font-bold'
                        : 'bg-[#efe8da] text-sa-text-muted hover:text-sa-text border border-[#e2d7c5]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs text-sa-text-muted font-medium">Your Letter / Message</label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-sa-text-dim">Ink:</span>
                  {INK_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedInk(c.hex)}
                      className={`w-4 h-4 rounded-full transition ${selectedInk === c.hex ? 'ring-2 ring-sa-accent scale-110' : 'opacity-60'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your letter here... It will remain permanently attributed to your identity."
                className="w-full bg-sa-polaroid border border-sa-border rounded-2xl p-4 text-sm font-handwriting focus:outline-none focus:border-sa-accent"
                style={{ color: selectedInk }}
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-sa-accent hover:bg-sa-accent-hover disabled:bg-[#efe8da] text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{createMutation.isPending ? 'Sealing...' : 'Seal Letter into Time Capsule'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-sa-border pb-4">
          <h2 className="text-xl font-bold text-sa-text font-serif-title">
            Capsule Submissions ({entries.length})
          </h2>
          <span className="text-xs font-handwriting text-sa-accent text-base">
            {isRevealed ? 'Revealed View Active' : 'Encrypted & Sealed'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((item) => (
            <div key={item.id} className="bg-sa-polaroid border border-sa-border text-sa-polaroid-text rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between text-xs text-sa-text-dim border-b border-sa-border pb-3">
                <span className="text-sa-accent font-bold font-serif-title">{item.prompt}</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>

              {isRevealed ? (
                <div className="space-y-3">
                  <p className="font-handwriting text-lg leading-relaxed" style={{ color: item.ink_color || '#2b2623' }}>
                    "{item.message}"
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-sa-border text-xs text-sa-text-dim">
                    <span className="font-bold text-sa-polaroid-text">— {item.author_name}</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 bg-[#f3ece0] rounded-2xl border border-sa-border">
                  <Lock className="w-6 h-6 text-sa-accent mx-auto" />
                  <p className="text-xs text-sa-polaroid-text font-bold">Encrypted & Sealed</p>
                  <p className="text-[11px] text-sa-text-dim">Signed by {item.author_name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
