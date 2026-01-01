import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { creatorAPI, authAPI } from '../utils/api';

const Creator = () => {
  const [user, setUser] = useState(null);
  const [packs, setPacks] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Drums',
    tags: '',
    price: '',
    audioFile: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await authAPI.getMe();
      setUser(userRes.data);

      if (userRes.data.role === 'creator' || userRes.data.role === 'admin') {
        const [packsRes, earningsRes] = await Promise.all([
          creatorAPI.listPacks(),
          creatorAPI.getEarnings()
        ]);
        setPacks(packsRes.data);
        setEarnings(earningsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await creatorAPI.apply();
      alert('Application submitted! Awaiting admin approval.');
      fetchData();
    } catch (error) {
      alert('Failed to apply: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      formData.append('tags', uploadForm.tags);
      formData.append('price', uploadForm.price);
      formData.append('audio_file', uploadForm.audioFile);

      await creatorAPI.uploadPack(formData);
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', category: 'Drums', tags: '', price: '', audioFile: null });
      alert('Pack uploaded successfully!');
      fetchData();
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  // Not a creator yet
  if (user?.role === 'user') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <div className="glass-panel p-12">
              <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                Become a Creator
              </h1>
              <p className="text-gray-400 mb-8 text-lg">
                Share your sounds with the world and earn 90% revenue on every sale!
              </p>
              <button onClick={handleApply} className="btn-primary text-lg" data-testid="apply-creator-button">
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending approval
  if (user?.role === 'creator' && !user?.creator_approved) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <div className="glass-panel p-12">
              <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                Application Pending
              </h1>
              <p className="text-gray-400 text-lg">
                Your creator application is under review. You'll be notified once approved!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Approved creator dashboard
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }} data-testid="creator-dashboard-title">
              🎧 Creator Dashboard
            </h1>
            <button onClick={() => setShowUploadModal(true)} className="btn-primary" data-testid="upload-pack-button">
              + Upload Pack
            </button>
          </div>

          {/* Earnings Stats */}
          {earnings && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="glass-panel p-6" data-testid="total-packs-stat">
                <p className="text-gray-400 text-sm mb-1">Total Packs</p>
                <p className="text-3xl font-bold">{earnings.total_packs}</p>
              </div>
              <div className="glass-panel p-6" data-testid="total-downloads-stat">
                <p className="text-gray-400 text-sm mb-1">Total Downloads</p>
                <p className="text-3xl font-bold">{earnings.total_downloads}</p>
              </div>
              <div className="glass-panel p-6" data-testid="total-revenue-stat">
                <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">${earnings.total_revenue.toFixed(2)}</p>
              </div>
              <div className="glass-panel p-6 bg-gradient-to-br from-violet-500/20 to-purple-600/20" data-testid="earnings-stat">
                <p className="text-gray-400 text-sm mb-1">Your Earnings (90%)</p>
                <p className="text-3xl font-bold text-green-400">${earnings.creator_earnings.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* My Packs */}
          <h2 className="text-2xl font-bold mb-4">My Packs</h2>
          {packs.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <p className="text-gray-400">No packs yet. Upload your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packs.map((pack) => (
                <div key={pack.pack_id} className="glass-panel p-6" data-testid="creator-pack-card">
                  <h3 className="text-xl font-bold mb-2">{pack.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{pack.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-violet-500/20 rounded">{pack.category}</span>
                    <span className="text-lg font-bold">
                      {pack.is_free ? 'Free' : `$${pack.price}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">{pack.download_count} downloads</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)}>
          <div className="max-w-2xl w-full glass-panel p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Upload Sample Pack</h2>
            <form onSubmit={handleUpload}>
              <input
                type="text"
                placeholder="Pack Title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                required
                data-testid="upload-title-input"
              />
              <textarea
                placeholder="Description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500 h-24"
                required
                data-testid="upload-description-input"
              ></textarea>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                data-testid="upload-category-select"
              >
                <option value="Drums">Drums</option>
                <option value="Bass">Bass</option>
                <option value="Synths">Synths</option>
                <option value="FX">FX</option>
                <option value="Vocals">Vocals</option>
                <option value="Loops">Loops</option>
              </select>
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                data-testid="upload-tags-input"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price (USD) - 0 for free"
                value={uploadForm.price}
                onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                required
                data-testid="upload-price-input"
              />
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setUploadForm({ ...uploadForm, audioFile: e.target.files[0] })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                required
                data-testid="upload-audio-input"
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-primary" data-testid="submit-upload-button">
                  Upload
                </button>
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Creator;