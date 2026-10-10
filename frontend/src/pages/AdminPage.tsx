import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Check, Users, Image, Video, Clock, Plus } from 'lucide-react';
import { useAuthStore } from '@/store';
import { adminApi, mediaApi, invitesApi, albumsApi } from '@/api';
import type { DashboardStats, MediaItem, InviteCode, Album } from '@/types';

export default function AdminPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'queue' | 'invites' | 'stats'>('queue');

  // Redirect non-admin users
  if (!user || (user.role !== 'admin' && user.role !== 'curator')) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Shield className="w-12 h-12 text-sa-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white font-serif-title mb-2">Access Denied</h2>
        <p className="text-xs text-sa-text-muted">This area is restricted to album curators.</p>
      </div>
    );
  }

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
  });

  const { data: albumsData } = useQuery({
    queryKey: ['albums'],
    queryFn: () => albumsApi.list(),
  });

  const { data: pendingData } = useQuery({
    queryKey: ['pending-media'],
    queryFn: () => mediaApi.listPending(),
  });

  const { data: invitesData } = useQuery({
    queryKey: ['invite-codes'],
    queryFn: () => invitesApi.list(),
  });

  const albums: Album[] = albumsData?.data || [];
  const [selectedAlbumMap, setSelectedAlbumMap] = useState<Record<string, string>>({});

  const stats: DashboardStats = statsData?.data || {
    total_users: 0, total_photos: 0, total_videos: 0,
    pending_moderation: 0, total_albums: 0, storage_used_bytes: 0,
    capsule_entries: 0, active_invite_codes: 0,
  };

  const pendingItems: MediaItem[] = pendingData?.data?.items || [];
  const inviteCodes: InviteCode[] = invitesData?.data || [];

  const approveMutation = useMutation({
    mutationFn: ({ id, targetAlbumId }: { id: string; targetAlbumId?: string }) =>
      mediaApi.moderate(id, { status: 'approved', album_id: targetAlbumId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-media'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => mediaApi.moderate(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-media'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => invitesApi.generate(5),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invite-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sa-border pb-6">
        <div>
          <span className="text-xs text-sa-accent font-handwriting text-lg">Curation Room</span>
          <h1 className="text-3xl font-normal text-sa-text font-serif-title">Admin Curation Portal</h1>
        </div>

        <div className="flex gap-2">
          {(['queue', 'invites', 'stats'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold capitalize transition ${
                activeTab === t
                  ? 'bg-sa-accent text-white'
                  : 'bg-[#efe8da] text-sa-text-muted border border-[#e2d7c5]'
              }`}
            >
              {t === 'queue' ? `Moderation Queue (${pendingItems.length})` : t === 'invites' ? 'Invite Codes' : 'Dashboard'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview (always visible at top) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Users', value: stats.total_users, color: 'text-sa-accent' },
          { icon: Image, label: 'Photos', value: stats.total_photos, color: 'text-emerald-700' },
          { icon: Video, label: 'Videos', value: stats.total_videos, color: 'text-blue-700' },
          { icon: Clock, label: 'Pending', value: stats.pending_moderation, color: 'text-amber-700' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#fffdf9] border border-sa-border p-4 rounded-2xl flex items-center gap-3">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <div className="text-xl font-bold text-sa-text font-serif-title">{stat.value}</div>
              <div className="text-[10px] text-sa-text-muted">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {pendingItems.length === 0 ? (
            <div className="bg-[#fffdf9] border border-sa-border p-12 rounded-3xl text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sa-text font-bold font-serif-title">Moderation Queue Clear</h3>
              <p className="text-xs text-sa-text-muted">All submitted photos have been reviewed and published to albums.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingItems.map((item) => (
                <div key={item.id} className="polaroid-card p-4 rounded-2xl space-y-4">
                  <img src={item.storage_path} alt="pending" className="w-full h-48 object-cover rounded-xl" />
                  <div className="space-y-1 text-xs text-sa-polaroid-text">
                    <p className="font-handwriting text-base font-bold">{item.note || 'No note provided'}</p>
                    <p className="text-sa-text-dim">By: {item.contributor_name}</p>
                  </div>

                  {/* Album Reassign Selector */}
                  <div className="space-y-1 pt-1 border-t border-sa-border">
                    <label className="block text-[10px] text-sa-text-muted font-medium">Move to Album:</label>
                    <select
                      value={selectedAlbumMap[item.id] || item.album_id}
                      onChange={(e) => setSelectedAlbumMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-full bg-[#f8f4ea] border border-sa-border rounded-xl px-2.5 py-1.5 text-xs text-sa-text focus:outline-none focus:border-sa-accent"
                    >
                      {albums.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-sa-border">
                    <button
                      onClick={() => approveMutation.mutate({ id: item.id, targetAlbumId: selectedAlbumMap[item.id] || item.album_id })}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl text-xs font-bold transition"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(item.id)}
                      disabled={rejectMutation.isPending}
                      className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-800 py-2 rounded-xl text-xs font-bold transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invites Tab */}
      {activeTab === 'invites' && (
        <div className="bg-[#fffdf9] border border-sa-border rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-sa-border pb-4">
            <h2 className="text-lg font-bold text-sa-text font-serif-title">One-Time Registration Codes</h2>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-sa-accent hover:bg-sa-accent-hover text-white px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {generateMutation.isPending ? 'Generating...' : 'Generate Codes'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {inviteCodes.map((inv, idx) => (
              <div key={idx} className="bg-[#f8f4ea] border border-sa-border p-4 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-sa-accent text-sm tracking-wide">{inv.code}</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  inv.is_used ? 'bg-[#efe8da] text-sa-text-dim' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {inv.is_used ? 'SPENT' : 'ACTIVE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#fffdf9] border border-sa-border p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-sa-text font-serif-title">Storage Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-sa-text-muted">Total Storage</span>
                <span className="text-sa-text font-bold">{(stats.storage_used_bytes / (1024**3)).toFixed(2)} GB used</span>
              </div>
              <div className="w-full bg-[#efe8da] h-2 rounded-full overflow-hidden">
                <div className="bg-sa-accent h-full" style={{ width: `${Math.min((stats.storage_used_bytes / (500 * 1024**3)) * 100, 100)}%` }} />
              </div>
              <p className="text-[10px] text-sa-text-dim">Upload volume health</p>
            </div>
          </div>

          <div className="bg-[#fffdf9] border border-sa-border p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-sa-text font-serif-title">Capsule Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-sa-text-muted">Total Entries</span>
                <span className="text-sa-text font-bold">{stats.capsule_entries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sa-text-muted">Active Invite Codes</span>
                <span className="text-sa-text font-bold">{stats.active_invite_codes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sa-text-muted">Total Albums</span>
                <span className="text-sa-text font-bold">{stats.total_albums}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
