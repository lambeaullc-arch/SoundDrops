import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { adminAPI } from '../utils/api';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // stats, creators, upload

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Drums',
    tags: '',
    price: '',
    creatorEmail: '',
    isFree: false,
    audioFile: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, creatorsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.listCreators()
      ]);
      setStats(statsRes.data);
      setCreators(creatorsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCreator = async (creatorId) => {
    try {
      await adminAPI.approveCreator(creatorId);
      alert('Creator approved!');
      fetchData();
    } catch (error) {
      alert('Failed to approve: ' + (error.response?.data?.detail || error.message));
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
      formData.append('creator_email', uploadForm.creatorEmail);
      formData.append('is_free', uploadForm.isFree);
      formData.append('audio_file', uploadForm.audioFile);

      await adminAPI.uploadPack(formData);
      alert('Pack uploaded successfully!');
      setUploadForm({
        title: '',
        description: '',
        category: 'Drums',
        tags: '',
        price: '',
        creatorEmail: '',
        isFree: false,
        audioFile: null
      });
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Unbounded, sans-serif' }} data-testid="admin-dashboard-title">
            🛠️ Admin Dashboard
          </h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 rounded-lg transition ${activeTab === 'stats' ? 'bg-violet-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
              data-testid="admin-tab-stats"
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('creators')}
              className={`px-6 py-3 rounded-lg transition ${activeTab === 'creators' ? 'bg-violet-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
              data-testid="admin-tab-creators"
            >
              Pending Creators ({creators.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 rounded-lg transition ${activeTab === 'upload' ? 'bg-violet-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
              data-testid="admin-tab-upload"
            >
              Upload Pack
            </button>
          </div>

          {/* Statistics */}
          {activeTab === 'stats' && stats && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Platform Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6" data-testid="stat-users">
                  <p className="text-gray-400 text-sm mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{stats.total_users}</p>
                </div>
                <div className="glass-panel p-6" data-testid="stat-creators">
                  <p className="text-gray-400 text-sm mb-1">Active Creators</p>
                  <p className="text-3xl font-bold">{stats.total_creators}</p>
                </div>
                <div className="glass-panel p-6" data-testid="stat-packs">
                  <p className="text-gray-400 text-sm mb-1">Total Packs</p>
                  <p className="text-3xl font-bold">{stats.total_packs}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6" data-testid="stat-purchases">
                  <p className="text-gray-400 text-sm mb-1">Total Purchases</p>
                  <p className="text-3xl font-bold">{stats.total_purchases}</p>
                </div>
                <div className="glass-panel p-6" data-testid="stat-subscriptions">
                  <p className="text-gray-400 text-sm mb-1">Active Subscriptions</p>
                  <p className="text-3xl font-bold">{stats.total_subscriptions}</p>
                </div>
                <div className="glass-panel p-6 bg-gradient-to-br from-violet-500/20 to-purple-600/20" data-testid="stat-revenue">
                  <p className="text-gray-400 text-sm mb-1">Platform Earnings (10%)</p>
                  <p className="text-3xl font-bold text-green-400">${stats.platform_earnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="glass-panel p-6 mt-6">
                <h3 className="text-xl font-bold mb-4">Revenue Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Pack Sales Revenue</p>
                    <p className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Subscription Revenue</p>
                    <p className="text-2xl font-bold">${stats.subscription_revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Creator Earnings (90%)</p>
                    <p className="text-2xl font-bold">${stats.creator_earnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Creators */}
          {activeTab === 'creators' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Pending Creator Applications</h2>
              {creators.length === 0 ? (
                <div className="glass-panel p-12 text-center">
                  <p className="text-gray-400">No pending applications</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {creators.map((creator) => (
                    <div key={creator.user_id} className="glass-panel p-6" data-testid="pending-creator-card">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={creator.picture || 'https://via.placeholder.com/60'}
                          alt={creator.name}
                          className="w-16 h-16 rounded-full"
                        />
                        <div>
                          <h3 className="text-xl font-bold">{creator.name}</h3>
                          <p className="text-gray-400 text-sm">{creator.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleApproveCreator(creator.user_id)}
                        className="w-full btn-primary"
                        data-testid="approve-creator-button"
                      >
                        ✓ Approve Creator
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Pack */}
          {activeTab === 'upload' && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">Upload Pack for Creator</h2>
              <div className="glass-panel p-6">
                <form onSubmit={handleUpload}>
                  <input
                    type="email"
                    placeholder="Creator Email"
                    value={uploadForm.creatorEmail}
                    onChange={(e) => setUploadForm({ ...uploadForm, creatorEmail: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="admin-upload-creator-email"
                  />
                  <input
                    type="text"
                    placeholder="Pack Title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="admin-upload-title"
                  />
                  <textarea
                    placeholder="Description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500 h-24"
                    required
                    data-testid="admin-upload-description"
                  ></textarea>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                    data-testid="admin-upload-category"
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
                    data-testid="admin-upload-tags"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price (USD)"
                    value={uploadForm.price}
                    onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="admin-upload-price"
                  />
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadForm.isFree}
                      onChange={(e) => setUploadForm({ ...uploadForm, isFree: e.target.checked })}
                      className="w-5 h-5"
                      data-testid="admin-upload-is-free"
                    />
                    <span>Mark as Free Pack</span>
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setUploadForm({ ...uploadForm, audioFile: e.target.files[0] })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="admin-upload-audio"
                  />
                  <button type="submit" className="w-full btn-primary" data-testid="admin-submit-upload">
                    Upload Pack
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
