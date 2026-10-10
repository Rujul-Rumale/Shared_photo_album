import { cn, ALBUM_TILTS } from '@/utils';
import { Link } from 'react-router-dom';
import type { Album } from '@/types';

interface PolaroidCardProps {
  album: Album;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export default function PolaroidCard({ album, onClick, href, className }: PolaroidCardProps) {
  const tilt = ALBUM_TILTS[album.slug] || 'rotate-1';

  const CardContent = (
    <div className={cn(
      "polaroid-card p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:rotate-0 group relative",
      tilt,
      className
    )}>
      <div className="tape-strip absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 rounded-sm -rotate-1 z-20" />

      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#ebe4d8]">
        <img
          src={album.cover_url || 'https://placehold.co/600x400/faf7f2/bd532b?text=Photo+Album'}
          alt={album.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <span className="absolute top-3 right-3 bg-sa-bg/90 text-sa-accent text-[10px] font-bold px-2.5 py-1 rounded-full border border-sa-border">
          {album.tag || 'Memory'}
        </span>
      </div>

      <div className="pt-4 space-y-2 text-sa-polaroid-text">
        <h3 className="text-xl font-bold font-serif-title group-hover:text-sa-accent transition">
          {album.name}
        </h3>
        <p className="text-xs text-sa-text-muted line-clamp-2 leading-relaxed">
          {album.description}
        </p>
        <div className="pt-3 flex items-center justify-between text-xs font-handwriting text-sa-text-dim border-t border-sa-border">
          <span>{(album.photo_count && album.photo_count > 0) ? `${album.photo_count} Photos` : 'Photo Album'}</span>
          <span className="text-sa-accent font-bold">Open Album →</span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href} onClick={onClick}>{CardContent}</Link>;
  }
  return <div onClick={onClick}>{CardContent}</div>;
}
