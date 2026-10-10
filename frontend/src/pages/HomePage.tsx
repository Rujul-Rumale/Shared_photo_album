import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowRight, Upload, Lock } from 'lucide-react';
import { albumsApi } from '@/api';
import PolaroidCard from '@/components/PolaroidCard';
import { DEFAULT_ARCHIVE_ALBUMS } from '@/utils';
import type { Album } from '@/types';

const STATS = [
  { label: 'Shared Albums', val: 'Curated' },
  { label: 'Contributors', val: 'Everyone' },
  { label: 'Time Capsule', val: 'Sealed' },
  { label: 'Algorithms', val: 'Zero' },
];

export default function HomePage() {
  const { data: albumsData } = useQuery({
    queryKey: ['albums'],
    queryFn: () => albumsApi.list(),
  });

  const albums: Album[] = (albumsData?.data && albumsData.data.length > 0) ? albumsData.data : DEFAULT_ARCHIVE_ALBUMS;

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#efe8da] border border-[#e2d7c5] text-sa-accent text-xs font-handwriting text-base">
              <Sparkles className="w-4 h-4 text-sa-accent" />
              <span>One shared album for the whole group</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-normal text-sa-text leading-[1.15] font-serif-title">
              Every great moment, <br />
              <span className="italic text-sa-accent">one memory at a time.</span>
            </h1>

            <p className="text-sa-text-muted text-xs sm:text-sm lg:text-base max-w-2xl leading-relaxed">
              No algorithms, no likes, no feeds. Just everyone's photos in one shared collection, curated and kept for the long run.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                to="/albums"
                className="bg-sa-accent hover:bg-sa-accent-hover text-white px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-2"
              >
                <span>Browse Photo Albums</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/contribute"
                className="bg-[#efe8da] hover:bg-[#e6decb] text-sa-text px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold border border-[#e2d7c5] transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-sa-accent" />
                <span>Upload a Photo</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((stat, idx) => (
                <div key={idx} className="bg-[#fffdf9] border border-sa-border p-3.5 rounded-2xl text-center">
                  <div className="text-base sm:text-lg font-bold text-sa-accent font-serif-title">{stat.val}</div>
                  <div className="text-[11px] text-sa-text-muted mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Polaroid Stack */}
          <div className="lg:col-span-5 relative flex justify-center py-6">
            <div className="relative w-72 sm:w-80">
              <div className="polaroid-card p-4 rounded-xl -rotate-6 transform translate-x-4 translate-y-2 absolute inset-0 opacity-80 pointer-events-none">
                <div className="aspect-[4/3] bg-[#ebe4d8] rounded-lg overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80" alt="Group gathering" className="w-full h-full object-cover" />
                </div>
                <div className="pt-3 text-center font-handwriting text-base text-sa-text">First Day Together</div>
              </div>

              <div className="polaroid-card p-4 rounded-xl rotate-6 transform -translate-x-4 translate-y-4 relative z-10 shadow-lg">
                <div className="aspect-[4/3] bg-[#ebe4d8] rounded-lg overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80" alt="Friends" className="w-full h-full object-cover" />
                </div>
                <div className="pt-3 text-center font-handwriting text-lg text-sa-text font-bold">Golden Hour Crew</div>
                <div className="tape-strip absolute -top-3 right-8 w-20 h-6 rounded-sm rotate-3" />
              </div>

              <div className="ticket-stub absolute -bottom-6 -left-6 z-20 px-3 py-2 rounded-lg text-xs font-handwriting -rotate-12 shadow-sm hidden sm:block">
                <span>Shared Album • Keep this moment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Albums */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sa-border pb-5">
          <div>
            <span className="text-xs text-sa-accent font-handwriting text-lg">The Collection</span>
            <h2 className="text-2xl sm:text-3xl font-normal text-sa-text font-serif-title">Curated Photo Albums</h2>
          </div>
          <Link to="/albums" className="text-xs font-semibold text-sa-accent hover:underline flex items-center gap-1 self-start sm:self-auto">
            <span>Explore All Albums</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.slice(0, 6).map((album) => (
            <PolaroidCard key={album.id} album={album} href={`/albums/${album.slug}`} />
          ))}
        </div>
      </section>

      {/* Time Capsule Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#fffdf9] border border-sa-border rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sa-accent/10 text-sa-accent text-xs font-handwriting text-base">
              <Lock className="w-3.5 h-3.5" />
              <span>Sealed Capsule • Opens on Reveal Day</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-normal text-sa-text font-serif-title">
              Leave a Letter for the Future
            </h2>

            <p className="text-sa-text-muted text-xs sm:text-sm leading-relaxed">
              Write a signed letter to your future self or leave a note for the group. All entries stay sealed until the ceremonial reveal.
            </p>

            <div className="pt-2">
              <Link
                to="/timecapsule"
                className="bg-sa-accent hover:bg-sa-accent-hover text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-2 inline-flex"
              >
                <span>Write Time Capsule Letter</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
