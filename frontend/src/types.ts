export interface User {
  id: string;
  email: string;
  personal_email: string | null;
  name: string;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'curator';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Album {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  tag: string | null;
  photo_count: number;
  video_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  album_id: string;
  contributor_id: string;
  original_filename: string;
  storage_path: string;
  thumbnail_path: string | null;
  mime_type: string;
  file_size: number;
  media_type: 'photo' | 'video';
  status: 'pending' | 'approved' | 'rejected';
  note: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  created_at: string;
  contributor_name: string;
  contributor_avatar: string | null;
}

export interface CapsuleEntry {
  id: string;
  author_id: string;
  author_name: string;
  prompt: string;
  message: string;
  ink_color: string;
  status: 'open' | 'sealed' | 'revealed';
  media_id: string | null;
  media_url: string | null;
  created_at: string;
  updated_at: string | null;
  sealed_at: string | null;
}

export interface InviteCode {
  id: string;
  code: string;
  is_used: boolean;
  used_by_id: string | null;
  used_by_name: string | null;
  created_at: string;
  used_at: string | null;
}

export interface AllowedUser {
  id: string;
  email: string;
  full_name: string;
  is_used: boolean;
  used_by_id: string | null;
  used_by_name: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_photos: number;
  total_videos: number;
  pending_moderation: number;
  total_albums: number;
  storage_used_bytes: number;
  capsule_entries: number;
  active_invite_codes: number;
}

export interface UploadFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}
