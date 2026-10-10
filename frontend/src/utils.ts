import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Album } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getDaysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getRandomTilt(): string {
  const tilts = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-3', 'rotate-3'];
  return tilts[Math.floor(Math.random() * tilts.length)];
}

export const ALBUM_TILTS: Record<string, string> = {
  'getting-started': '-rotate-2',
  'everyday-moments': 'rotate-2',
  events: '-rotate-1',
  trips: 'rotate-1',
  'behind-the-scenes': '-rotate-2',
  favorites: 'rotate-2',
  miscellaneous: '-rotate-1',
  'time-capsule': 'rotate-1',
};

// Fallback albums shown when the API is unreachable (e.g. fresh setup).
// Mirror of backend/scripts/seed_data.py - edit both together.
export const DEFAULT_ARCHIVE_ALBUMS: Album[] = [
  {
    id: 'getting-started',
    slug: 'getting-started',
    name: 'Getting Started',
    description: 'First photos, first faces, and the beginning of the collection.',
    cover_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    tag: 'The Beginning',
    sort_order: 1,
    photo_count: 0,
    video_count: 0,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'everyday-moments',
    slug: 'everyday-moments',
    name: 'Everyday Moments',
    description: 'Candid shots, shared meals, and ordinary days worth remembering.',
    cover_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
    tag: 'Daily Life',
    sort_order: 2,
    photo_count: 0,
    video_count: 0,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'events',
    slug: 'events',
    name: 'Events & Gatherings',
    description: 'Celebrations, meetups, workshops, and group activities.',
    cover_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    tag: 'Communities',
    sort_order: 3,
    photo_count: 0,
    video_count: 0,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'trips',
    slug: 'trips',
    name: 'Trips & Outings',
    description: 'Weekend getaways, road trips, hikes, and adventures together.',
    cover_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    tag: 'Getaways',
    sort_order: 4,
    photo_count: 0,
    video_count: 0,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'behind-the-scenes',
    slug: 'behind-the-scenes',
    name: 'Behind the Scenes',
    description: 'Bloopers, setup chaos, and the moments between the moments.',
    cover_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    tag: 'Candid',
    sort_order: 5,
    photo_count: 0,
    video_count: 0,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'favorites',
    slug: 'favorites',
    name: 'Favorites',
    description: 'The all-time best shots, as picked by the curators.',
    cover_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    tag: 'Best Of',
    sort_order: 6,
    photo_count: 0,
    video_count: 0,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'miscellaneous',
    slug: 'miscellaneous',
    name: 'Miscellaneous',
    description: 'Random snapshots and everything that fits nowhere else.',
    cover_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    tag: 'Etc.',
    sort_order: 7,
    photo_count: 0,
    video_count: 0,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'time-capsule',
    slug: 'time-capsule',
    name: 'Time Capsule',
    description: 'Sealed letters and memories, locked until the reveal date.',
    cover_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tag: 'Sealed',
    sort_order: 8,
    photo_count: 0,
    video_count: 0,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
  },
];
