import { useState } from 'react';
import { X, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authApi } from '@/api';

interface AuthModalProps {
  onClose: () => void;
}

// NOTE: This template ships with a simplified dev sign-in flow. For
// production, replace the mock token in step 3 with a real Google
// Identity Services button that returns a Google ID token, then POST it
// to /api/v1/auth/google along with the invite code (if required).

export default function AuthModal({ onClose }: AuthModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed.includes('@') || !fullName.trim()) {
      setError('Please enter your name and a valid email address.');
      return;
    }
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep(3);
  };

  const handleStep3 = async () => {
    setError('');
    setLoading(true);

    try {
      const mockGoogleToken = `mock-google-token-${Date.now()}`;
      const response = await authApi.googleAuth(
        mockGoogleToken,
        inviteCode.trim() || undefined
      );

      if (response.data?.access_token && response.data?.user) {
        login(response.data.user, response.data.access_token);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2b2623]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#fffdf9] border border-sa-border w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-sa-text-muted hover:text-sa-text">
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-sa-accent' : 'bg-[#efe8da]'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Step 1: Your Details */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-5">
            <div className="space-y-1">
              <span className="text-xs text-sa-accent font-handwriting text-base">Step 1 of 3</span>
              <h2 className="text-2xl font-bold text-sa-text font-serif-title">Join the shared album</h2>
              <p className="text-xs text-sa-text-muted leading-relaxed">
                Tell us who you are. Your name is shown next to every photo you contribute.
              </p>
            </div>

            <div>
              <label className="block text-xs text-sa-text-muted mb-1.5 font-medium">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-[#f8f4ea] border border-sa-border rounded-2xl px-4 py-3 text-xs text-sa-text focus:outline-none focus:border-sa-accent"
              />
            </div>

            <div>
              <label className="block text-xs text-sa-text-muted mb-1.5 font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-[#f8f4ea] border border-sa-border rounded-2xl px-4 py-3 text-xs text-sa-text focus:outline-none focus:border-sa-accent"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-sa-accent hover:bg-sa-accent-hover text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Invite Code (optional) */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-5">
            <div className="space-y-1">
              <span className="text-xs text-sa-accent font-handwriting text-base">Step 2 of 3</span>
              <h2 className="text-2xl font-bold text-sa-text font-serif-title">Got an invite code?</h2>
              <p className="text-xs text-sa-text-muted leading-relaxed">
                Welcome, <strong className="text-sa-text">{fullName}</strong>! If your organizer gave you a one-time invite code, enter it here. Otherwise just continue.
              </p>
            </div>

            <div>
              <label className="block text-xs text-sa-text-muted mb-1.5 font-medium">Invite Code (Optional)</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="SA-XXXXX"
                className="w-full bg-[#f8f4ea] border border-sa-border rounded-2xl px-4 py-3 text-xs text-sa-text focus:outline-none focus:border-sa-accent uppercase"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-sa-text-muted hover:text-sa-text bg-[#efe8da]"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-sa-accent hover:bg-sa-accent-hover text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Sign in with Google */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-xs text-sa-accent font-handwriting text-base">Step 3 of 3 • Final Step</span>
              <h2 className="text-2xl font-bold text-sa-text font-serif-title">Sign in with Google</h2>
              <p className="text-xs text-sa-text-muted leading-relaxed">
                One click and you're in. This account is used for all future sign-ins.
              </p>
            </div>

            <div className="bg-[#f8f4ea] border border-sa-border p-4 rounded-2xl space-y-2 text-xs text-sa-text-muted">
              <div className="flex items-center gap-2 text-sa-accent font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Details Confirmed</span>
              </div>
              <p>Name: <strong className="text-sa-text">{fullName}</strong></p>
              <p>Email: <strong className="text-sa-text">{email}</strong></p>
            </div>

            <button
              onClick={handleStep3}
              disabled={loading}
              className="w-full bg-sa-accent hover:bg-sa-accent-hover disabled:bg-[#efe8da] disabled:text-sa-text-dim text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
