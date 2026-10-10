import { X, Download } from 'lucide-react';
import type { MediaItem, Album } from '@/types';

interface LightboxModalProps {
  item: MediaItem;
  album?: Album;
  onClose: () => void;
}

export default function LightboxModal({ item, album, onClose }: LightboxModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#2b2623]/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#fffdf9] border border-sa-border max-w-4xl w-full rounded-3xl overflow-hidden flex flex-col md:flex-row relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-[#2b2623]/70 text-white p-2 rounded-full hover:bg-[#2b2623]">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 bg-[#2b2623] flex items-center justify-center p-4">
          <img
            src={item.storage_path}
            alt={item.note || 'Shared memory'}
            className="max-h-[70vh] w-auto object-contain rounded-xl"
          />
        </div>

        <div className="w-full md:w-80 p-6 space-y-4 bg-[#fffdf9] border-t md:border-t-0 md:border-l border-sa-border flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[11px] bg-sa-accent/10 text-sa-accent px-3 py-1 rounded-full font-bold">
              {album?.name || 'Album Photo'}
            </span>

            <p className="font-handwriting text-xl text-sa-text leading-snug">{item.note || 'No caption provided'}</p>

            <div className="space-y-2 text-xs text-sa-text-muted border-t border-sa-border pt-3">
              <div>
                <span className="text-sa-text-dim">Contributor:</span>
                <p className="text-sa-text font-bold">{item.contributor_name}</p>
              </div>
              <div>
                <span className="text-sa-text-dim">Date Uploaded:</span>
                <p className="text-sa-text font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <a
            href={item.storage_path}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-sa-bg hover:bg-[#efe8da] text-sa-accent py-2.5 rounded-2xl text-xs font-semibold text-center block border border-sa-border flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download High-Res Original
          </a>
        </div>
      </div>
    </div>
  );
}
