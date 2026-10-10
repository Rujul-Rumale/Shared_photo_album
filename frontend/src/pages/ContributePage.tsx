import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { albumsApi, mediaApi } from '@/api';
import { useAuthStore } from '@/store';
import { DEFAULT_ARCHIVE_ALBUMS } from '@/utils';
import type { UploadFile, Album } from '@/types';

export default function ContributePage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [note, setNote] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successNotice, setSuccessNotice] = useState(false);

  const { data: albumsData } = useQuery({
    queryKey: ['albums'],
    queryFn: () => albumsApi.list(),
  });

  const albums: Album[] = (albumsData?.data && albumsData.data.length > 0) ? albumsData.data : DEFAULT_ARCHIVE_ALBUMS;

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => mediaApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setSuccessNotice(true);
      setUploadedFiles([]);
      setNote('');
      setUploadProgress(100);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 3000);
    },
    onError: () => {
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const formatted = acceptedFiles.map((file) => ({
      id: `up-${Math.random().toString(36).substring(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploadedFiles((prev) => [...prev, ...formatted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startUpload = () => {
    if (!isAuthenticated) return;
    if (uploadedFiles.length === 0 || !selectedAlbum) return;

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', uploadedFiles[0].file);
    formData.append('album_id', selectedAlbum);
    if (note) formData.append('note', note);

    uploadMutation.mutate(formData);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 20;
      });
    }, 300);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-sa-border pb-6 space-y-2">
        <span className="text-xs text-sa-accent font-handwriting text-lg">Add to the Collection</span>
        <h1 className="text-3xl font-normal text-sa-text font-serif-title">Upload a Memory</h1>
        <p className="text-xs text-sa-text-muted">
          Upload photos or videos for curator review. All uploads are signed with your account name.
        </p>
      </div>

      {successNotice && (
        <div className="bg-sa-accent/10 border border-sa-accent/30 p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-sa-accent font-bold text-sm">
            <Check className="w-5 h-5" />
            <span>Photograph Submitted for Moderation!</span>
          </div>
          <p className="text-xs text-sa-text-muted leading-relaxed">
            <strong>Changed your mind?</strong> If you accidentally uploaded something you don't want shared, contact your album curators before it's published.
          </p>
          <button
            onClick={() => setSuccessNotice(false)}
            className="text-xs font-semibold text-sa-accent hover:underline"
          >
            Dismiss Notice
          </button>
        </div>
      )}

      <div className="bg-[#fffdf9] border border-sa-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Album Select */}
        <div>
          <label className="block text-xs text-sa-text-muted mb-2 font-medium">Select Album</label>
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="w-full bg-[#f8f4ea] border border-sa-border rounded-2xl px-4 py-3 text-xs text-sa-text focus:outline-none focus:border-sa-accent"
          >
            <option value="">Choose an album...</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
            ))}
          </select>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-[#d8cdbf] hover:border-sa-accent bg-[#f8f4ea] rounded-3xl p-8 text-center space-y-4 transition cursor-pointer relative ${
            isDragActive ? 'border-sa-accent bg-sa-accent/5' : ''
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-sa-accent mx-auto" />
          <div>
            <p className="text-sm font-bold text-sa-text font-serif-title">
              {isDragActive ? 'Drop files here...' : 'Drag and drop photos here, or click to browse'}
            </p>
            <p className="text-xs text-sa-text-dim mt-1">High-res JPG, PNG, MP4</p>
          </div>
        </div>

        {/* File Preview Grid */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4 border-t border-sa-border pt-4">
            <h3 className="text-xs text-sa-text-muted font-medium">Upload Queue ({uploadedFiles.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {uploadedFiles.map((item) => (
                <div key={item.id} className="relative group polaroid-card p-2 rounded-xl">
                  {item.file.type.startsWith('image/') ? (
                    <img src={item.preview} alt="preview" className="w-full h-24 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-24 bg-[#f8f4ea] rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-sa-text-muted" />
                    </div>
                  )}
                  <p className="text-[10px] text-sa-polaroid-text font-medium truncate mt-1">{item.name}</p>
                  <p className="text-[9px] text-sa-text-dim">{item.size}</p>
                  <button
                    onClick={() => removeFile(item.id)}
                    className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-xs text-sa-text-muted mb-1.5 font-medium">Memory Note / Caption</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="E.g., Sunset group photo after the hike..."
            className="w-full bg-[#f8f4ea] border border-sa-border rounded-2xl px-4 py-2.5 text-xs text-sa-text focus:outline-none focus:border-sa-accent"
          />
        </div>

        {/* Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-sa-accent font-medium">
              <span>Uploading to the album...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#efe8da] h-2 rounded-full overflow-hidden">
              <div className="bg-sa-accent h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={startUpload}
          disabled={isUploading || uploadedFiles.length === 0 || !selectedAlbum || !isAuthenticated}
          className="w-full bg-sa-accent hover:bg-sa-accent-hover disabled:bg-[#efe8da] disabled:text-sa-text-dim text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span>{!isAuthenticated ? 'Sign In to Upload' : isUploading ? 'Uploading...' : 'Upload Photos'}</span>
        </button>
      </div>
    </div>
  );
}
