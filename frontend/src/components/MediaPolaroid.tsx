import { cn } from '@/utils';
import type { MediaItem } from '@/types';

interface MediaPolaroidProps {
  item: MediaItem;
  onClick?: () => void;
  className?: string;
}

export default function MediaPolaroid({ item, onClick, className }: MediaPolaroidProps) {
  const tilts = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'];
  const tilt = tilts[Math.abs(item.id.charCodeAt(0)) % tilts.length];

  return (
    <div
      onClick={onClick}
      className={cn(
        "polaroid-card p-3.5 rounded-2xl cursor-pointer hover:rotate-0 transition-all duration-300 hover:scale-105 group relative",
        tilt,
        className
      )}
    >
      <div className="tape-strip absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-5 rounded-sm -rotate-2 z-10" />

      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#ebe4d8]">
        <img
          src={item.storage_path}
          alt={item.note || 'Shared memory'}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>

      <div className="pt-3 text-sa-polaroid-text space-y-1">
        <p className="font-handwriting text-base leading-snug line-clamp-2">{item.note || 'Shared memory'}</p>
        <div className="flex items-center justify-between text-[11px] text-sa-text-dim pt-1 border-t border-sa-border">
          <span>By {item.contributor_name}</span>
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
