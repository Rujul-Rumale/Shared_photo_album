import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import AlbumsPage from '@/pages/AlbumsPage';
import AlbumDetailPage from '@/pages/AlbumDetailPage';
import CapsulePage from '@/pages/CapsulePage';
import ContributePage from '@/pages/ContributePage';
import ProfilePage from '@/pages/ProfilePage';
import AboutPage from '@/pages/AboutPage';
import AdminPage from '@/pages/AdminPage';
import AdminGuard from '@/components/AdminGuard';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/albums/:slug" element={<AlbumDetailPage />} />
        <Route path="/timecapsule" element={<CapsulePage />} />
        <Route path="/contribute" element={<ContributePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin" element={
          <AdminGuard>
            <AdminPage />
          </AdminGuard>
        } />
      </Routes>
    </Layout>
  );
}

export default App;
