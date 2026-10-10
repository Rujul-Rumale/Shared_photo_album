import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authApi, mediaApi } from '@/api';
import LightboxModal from '@/components/LightboxModal';
import type { MediaItem } from '@/types';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [personalInput, setPersonalInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  const { data: myMediaData } = useQuery({
    queryKey: ['my-media'],
    queryFn: () => mediaApi.list({ contributor_id: user?.id }),
    enabled: !!user?.id,
  });

  const linkMutation = useMutation({
    mutationFn: (email: string) => authApi.linkPersonalEmail(email),
    onSuccess: (response) => {
      updateUser(response.data);
      setSavedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['my-media'] });
    },
  });

  const myMedia: MediaItem[] = myMediaData?.data?.items || [];

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalInput.trim().includes('@')) return;
    linkMutation.mutate(personalInput.trim());
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-sa-text-muted">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Card */}
      <div className="bg-[#fffdf9] border border-sa-border rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <img
          src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=bd532b&color=fff`}
          alt={user.name}
          className="w-20 h-20 rounded-2xl object-cover ring-2 ring-sa-accent"
        />
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-sa-text font-serif-title">{user.name}</h1>
            {user.role !== 'user' && (
              <span className="bg-sa-accent text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">{user.role}</span>
            )}
          </div>
          <p className="text-xs text-sa-text-muted">{user.email}</p>
          <p className="text-xs text-emerald-700 font-medium">
            Personal Linked: {user.personal_email || 'Not Linked Yet'}
          </p>
        </div>
        <button
          onClick={() => logout()}
          className="bg-[#efe8da] hover:bg-[#e6decb] text-rose-700 px-4 py-2 rounded-2xl text-xs font-semibold border border-[#e2d7c5]"
        >
          Sign Out
        </button>
      </div>

      {/* Email Migration */}
      <div className="bg-[#fffdf9] border border-sa-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sa-accent font-bold text-sm font-serif-title">
          <Shield className="w-5 h-5" />
          <span>Backup Email</span>
        </div>
        <p className="text-xs text-sa-text-muted leading-relaxed">
          Link a backup email below so you can always recover access to your contributions, even if you lose access to your current sign-in.
        </p>

        {savedSuccess && (
          <p className="text-xs text-emerald-700 font-bold">✓ Personal email linked successfully!</p>
        )}

        <form onSubmit={handleLink} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="email"
            required
            value={personalInput}
            onChange={(e) => setPersonalInput(e.target.value)}
            placeholder="Backup email (e.g. alex@backup.com)"
            className="flex-1 bg-[#f8f4ea] border border-sa-border rounded-2xl px-4 py-2.5 text-xs text-sa-text focus:outline-none focus:border-sa-accent"
          />
          <button
            type="submit"
            disabled={linkMutation.isPending}
            className="bg-sa-accent hover:bg-sa-accent-hover text-white px-6 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm"
          >
            {linkMutation.isPending ? 'Linking...' : 'Link Personal Email'}
          </button>
        </form>
      </div>

      {/* My Uploads */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-sa-text font-serif-title">Your Uploads ({myMedia.length})</h2>
        {myMedia.length === 0 ? (
          <p className="text-xs text-sa-text-muted">You haven't uploaded any photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {myMedia.map((m) => (
              <div key={m.id} className="polaroid-card p-2 rounded-xl cursor-pointer" onClick={() => setLightboxItem(m)}>
                <img src={m.storage_path} alt="user sub" className="w-full h-32 object-cover rounded-lg" />
                <p className="text-[11px] text-sa-polaroid-text font-handwriting truncate mt-2">{m.note || 'Untitled'}</p>
                <span className={`text-[10px] font-bold ${m.status === 'approved' ? 'text-emerald-700' : 'text-sa-accent'}`}>
                  Status: {m.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxItem && (
        <LightboxModal item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </div>
  );
}
