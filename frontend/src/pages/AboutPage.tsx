import { useNavigate } from 'react-router-dom';

export default function AboutPage() {
  const navigate = useNavigate();

  const features = [
    { title: 'No Algorithms', desc: 'No likes, comments, follower counts, or feeds. Pure browsing.' },
    { title: 'Shared Ownership', desc: 'Everyone contributes with their own signed account, so every photo has an owner.' },
    { title: 'Curated Quality', desc: 'All submissions are reviewed by album curators before being published.' },
    { title: 'Optional Time Capsule', desc: 'Sealed messages and letters, unlocked on a reveal date you choose.' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-4 border-b border-sa-border pb-8">
        <span className="text-xs text-sa-accent font-handwriting text-lg">Our Purpose</span>
        <h1 className="text-4xl font-normal text-sa-text font-serif-title">One Album, Everyone's Photos</h1>
        <p className="text-xs sm:text-sm text-sa-text-muted leading-relaxed max-w-xl mx-auto">
          Shared Album solves a familiar problem: group photos scattered across chats, stories, and drives. Here, everything lives in one curated place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((card, idx) => (
          <div key={idx} className="bg-[#fffdf9] border border-sa-border p-6 rounded-3xl space-y-2 shadow-sm">
            <h3 className="text-base font-bold text-sa-accent font-serif-title">{card.title}</h3>
            <p className="text-xs text-sa-text-muted leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#fffdf9] border border-sa-border rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <h2 className="text-2xl font-bold text-sa-text font-serif-title">Ready to contribute?</h2>
        <p className="text-xs text-sa-text-muted max-w-md mx-auto">
          Upload your favorite photos to the shared collection. Every photo is reviewed before it appears.
        </p>
        <button
          onClick={() => navigate('/contribute')}
          className="bg-sa-accent hover:bg-sa-accent-hover text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-sm"
        >
          Start Uploading
        </button>
      </div>
    </div>
  );
}
