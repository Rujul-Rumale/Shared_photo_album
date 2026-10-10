import { useAuthStore } from '@/store';
import { Shield, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated } = useAuthStore();

  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'curator');

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-sa-accent/10 text-sa-accent border border-sa-accent/20 flex items-center justify-center mx-auto shadow-sm">
          <Shield className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
            <Lock className="w-3.5 h-3.5" />
            <span>Restricted Admin Portal</span>
          </div>
          <h1 className="text-3xl font-normal text-sa-text font-serif-title">Access Denied</h1>
          <p className="text-xs text-sa-text-muted max-w-md mx-auto leading-relaxed">
            This area is restricted to album curators. If you need access, ask your album organizer.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="bg-sa-accent hover:bg-sa-accent-hover text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
