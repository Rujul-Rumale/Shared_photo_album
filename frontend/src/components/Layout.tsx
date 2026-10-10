import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import {
  Shield, X, ChevronDown,
  Home, Image, Clock, User, Info, Upload, Menu, Check, Pin
} from 'lucide-react';
import { cn } from '@/utils';
import AuthModal from './AuthModal';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/albums', label: 'Albums', icon: Image },
  { path: '/timecapsule', label: 'Time Capsule', icon: Clock },
  { path: '/contribute', label: 'Contribute', icon: Upload },
  { path: '/about', label: 'About', icon: Info },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'curator';
  const showBanner = isAuthenticated && !user?.personal_email && !bannerDismissed;

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-sa-bg text-sa-text font-sans antialiased selection:bg-sa-accent selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Backup Email Banner */}
      {showBanner && (
        <div className="bg-[#f3ece0] border-b border-sa-accent/20 text-sa-text-muted px-4 py-2.5 text-xs flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2 max-w-4xl overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-sa-accent text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Note</span>
            <span className="truncate">Add a backup email so you never lose access to the shared album.</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-sa-accent hover:underline font-bold text-[11px]"
            >
              Add Backup Email
            </button>
            <button onClick={() => setBannerDismissed(true)} className="text-sa-text-muted hover:text-sa-text">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#f8f4ea]/95 backdrop-blur-md border-b border-sa-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-sa-accent text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                SA
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-normal text-lg sm:text-2xl tracking-tight text-sa-text font-serif-title group-hover:text-sa-accent transition-colors">
                    Shared Album
                  </span>
                  <span className="hidden sm:inline-block text-[10px] bg-[#efe8da] text-sa-accent px-2 py-0.5 rounded-md font-handwriting font-bold border border-[#e2d7c5]">
                    Our Collection
                  </span>
                </div>
                <p className="hidden md:block text-[11px] text-sa-text-muted font-handwriting -mt-0.5">
                  One shared home for everyone's photos
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-1 bg-[#efe8da] p-1.5 rounded-2xl border border-[#e2d7c5]">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "bg-sa-accent text-white shadow-sm font-bold"
                        : "text-sa-text-muted hover:text-sa-text hover:bg-[#e6decb]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm",
                    location.pathname === '/admin'
                      ? "bg-sa-accent text-white"
                      : "bg-sa-accent/10 text-sa-accent hover:bg-sa-accent/20 border border-sa-accent/25"
                  )}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Curation</span>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-[#efe8da] border border-[#e2d7c5] hover:border-sa-accent/40 transition shadow-sm text-sa-text"
                  >
                    <img
                      src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=bd532b&color=fff`}
                      alt={user?.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-2 ring-sa-accent/40"
                    />
                    <span className="hidden sm:inline-block text-xs font-medium text-sa-text max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-sa-text-muted" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-sa-card border border-sa-border rounded-2xl shadow-xl p-2 z-50 space-y-1 text-xs"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-sa-border text-left">
                        <p className="font-bold text-sa-text truncate">{user?.name}</p>
                        <p className="text-[10px] text-sa-text-muted truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f3ece0] text-sa-text transition flex items-center gap-2 block"
                      >
                        <Pin className="w-3.5 h-3.5 text-sa-gold" />
                        <span>My Account & Uploads</span>
                      </Link>
                      <button
                        onClick={() => { logout(); setUserDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 transition flex items-center gap-2 border-t border-sa-border mt-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-sa-accent hover:bg-sa-accent-hover text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-bold transition shadow-sm"
                >
                  Sign In
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-[#efe8da] border border-[#e2d7c5] text-sa-text hover:text-sa-accent transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#f3ece0] border-b border-sa-border px-4 py-4 space-y-3 shadow-lg">
            <div className="text-[11px] font-handwriting text-sa-accent px-2">Menu</div>
            <div className="grid grid-cols-2 gap-2">
              {[...NAV_ITEMS, ...(isAdmin ? [{ path: '/admin', label: 'Curation Room', icon: Shield }] : []), { path: '/profile', label: 'My Profile', icon: User }].map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                const Icon = item.icon || Home;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "p-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between",
                      isActive
                        ? "bg-sa-accent text-white font-bold shadow-sm"
                        : "text-sa-text-muted bg-sa-bg border border-sa-border hover:text-sa-text"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#f0e9dd] border-t border-sa-border text-sa-text-muted py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3 text-sa-text font-serif-title text-xl">
                <div className="w-8 h-8 rounded-xl bg-sa-accent text-white flex items-center justify-center font-bold text-sm">SA</div>
                Shared Album
              </div>
              <p className="text-xs text-sa-text-muted leading-relaxed max-w-md">
                A curated shared photo collection for groups, clubs, and events. Upload together, curate together, keep the memories in one place.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sa-accent text-xs font-bold uppercase tracking-wider font-serif-title">Albums</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/albums" className="hover:text-sa-accent transition">Albums</Link></li>
                <li><Link to="/timecapsule" className="hover:text-sa-accent transition">Time Capsule</Link></li>
                <li><Link to="/contribute" className="hover:text-sa-accent transition">Contribute</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sa-accent text-xs font-bold uppercase tracking-wider font-serif-title">Curators</h4>
              <p className="text-xs text-sa-text-muted leading-relaxed">Need a photo removed or moved to another album?</p>
              <a href="mailto:curators@example.com" className="text-xs text-sa-accent hover:underline block font-medium">
                curators@example.com
              </a>
            </div>
          </div>
          <div className="pt-8 border-t border-sa-border flex flex-col sm:flex-row items-center justify-between text-xs text-sa-text-dim gap-4">
            <p>Shared Album — a reusable template for group photo collections.</p>
            <p className="font-handwriting text-base text-sa-accent">"Every photo has a home."</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </div>
  );
}
