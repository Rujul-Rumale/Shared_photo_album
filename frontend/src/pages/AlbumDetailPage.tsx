import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Camera, Upload, ArrowLeft } from 'lucide-react';
import { albumsApi, mediaApi } from '@/api';
import MediaPolaroid from '@/components/MediaPolaroid';
import LightboxModal from '@/components/LightboxModal';
import { DEFAULT_ARCHIVE_ALBUMS } from '@/utils';
import type { Album, MediaItem } from '@/types';

export default function AlbumDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  const { data: albumData } = useQuery({
    queryKey: ['album', slug],
    queryFn: () => albumsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const fallbackAlbum = DEFAULT_ARCHIVE_ALBUMS.find((a) => a.slug === slug);
  const album: Album | undefined = albumData?.data || fallbackAlbum;

  const { data: mediaData } = useQuery({
    queryKey: ['media', album?.id],
    queryFn: () => mediaApi.list({ album_id: album?.id }),
    enabled: !!album?.id,
  });

  const media: MediaItem[] = mediaData?.data?.items || [];

  if (!album) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Camera className="w-12 h-12 text-sa-text-muted mx-auto mb-4" />
        <p className="text-sa-text-muted">Loading album...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sa-border pb-6">
        <div>
          <span className="text-xs text-sa-accent font-handwriting text-lg">Photo Album</span>
          <h1 className="text-2xl sm:text-4xl font-normal text-sa-text font-serif-title">{album.name}</h1>
          <p className="text-xs text-sa-text-muted mt-1 max-w-xl">{album.description}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/albums"
            className="bg-[#efe8da] hover:bg-[#e6decb] text-sa-text px-4 py-2 rounded-2xl text-xs font-semibold border border-[#e2d7c5] transition self-start"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to All Albums
          </Link>
          <Link
            to="/contribute"
            className="bg-sa-accent hover:bg-sa-accent-hover text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-2 self-start"
          >
            <Upload className="w-4 h-4" />
            <span>Share a Memory</span>
          </Link>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="bg-[#fffdf9] border border-sa-border p-12 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
          <Camera className="w-12 h-12 text-sa-text-muted mx-auto" />
          <h3 className="text-lg font-bold text-sa-text font-serif-title">No Photos Published Yet</h3>
          <p className="text-xs text-sa-text-muted leading-relaxed">
            Nothing published in this album yet. Submitted uploads will be reviewed and added here.
          </p>
          <Link
            to="/contribute"
            className="bg-sa-accent text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition inline-block"
          >
            Upload First Photo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {media.map((item) => (
            <MediaPolaroid
              key={item.id}
              item={item}
              onClick={() => setLightboxItem(item)}
            />
          ))}
        </div>
      )}

      {lightboxItem && (
        <LightboxModal
          item={lightboxItem}
          album={album}
          onClose={() => setLightboxItem(null)}
        />
      )}
    </div>
  );
}
