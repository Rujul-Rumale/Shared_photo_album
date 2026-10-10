import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Upload } from 'lucide-react';
import { albumsApi } from '@/api';
import PolaroidCard from '@/components/PolaroidCard';
import { DEFAULT_ARCHIVE_ALBUMS } from '@/utils';
import type { Album } from '@/types';

export default function AlbumsPage() {
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: albumsData } = useQuery({
    queryKey: ['albums'],
    queryFn: () => albumsApi.list(),
  });

  const albums: Album[] = (albumsData?.data && albumsData.data.length > 0) ? albumsData.data : DEFAULT_ARCHIVE_ALBUMS;

  const tags = ['ALL', ...Array.from(new Set(albums.map((a) => a.tag).filter((t): t is string => Boolean(t))))];

  const filtered = albums.filter((a) => {
    const matchesTag = selectedTag === 'ALL' || a.tag === selectedTag;
    const matchesSearch = !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sa-border pb-6">
        <div>
          <span className="text-xs text-sa-accent font-handwriting text-lg">The Collection</span>
          <h1 className="text-2xl sm:text-4xl font-normal text-sa-text font-serif-title">Photo Albums</h1>
          <p className="text-xs text-sa-text-muted mt-1 max-w-xl">
            Browse every album in the shared collection. Every photo is reviewed and signed.
          </p>
        </div>
        <Link
          to="/contribute"
          className="bg-sa-accent hover:bg-sa-accent-hover text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-2 self-start"
        >
          <Upload className="w-4 h-4" />
          <span>Share a Memory</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                selectedTag === tag
                  ? 'bg-sa-accent text-white'
                  : 'bg-[#efe8da] text-sa-text-muted hover:text-sa-text border border-[#e2d7c5]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-sa-text-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search albums..."
            className="w-full bg-[#fffdf9] border border-sa-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-sa-text placeholder-sa-text-dim focus:outline-none focus:border-sa-accent"
          />
        </div>
      </div>

      {/* Album Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((album) => (
          <PolaroidCard key={album.id} album={album} href={`/albums/${album.slug}`} />
        ))}
      </div>
    </div>
  );
}
