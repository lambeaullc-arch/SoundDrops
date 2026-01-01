import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminAPI, samplesAPI } from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [creators, setCreators] = useState([]);
  const [allSamples, setAllSamples] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
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
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdmin = async () => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data;
      
      if (userData.role !== 'admin') {
        alert('Access denied. Admin only.');
        navigate('/');
        return;
      }
      
      setUser(userData);
      await fetchAllData();
    } catch (error) {
      alert('Please sign in as admin');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const [statsRes, creatorsRes, samplesRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.listCreators(),
        samplesAPI.list({}),
        adminAPI.getAllUsers()
      ]);
      setStats(statsRes.data);
      setCreators(creatorsRes.data);
      setAllSamples(samplesRes.data);
      setAllUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleApproveCreator = async (creatorId) => {
    try {
      await adminAPI.approveCreator(creatorId);
      alert('Creator approved successfully!');
      fetchAllData();
    } catch (error) {
      alert('Failed to approve: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUploadPack = async (e) => {
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
      fetchAllData();
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleFree = async (packId, currentStatus) => {
    try {
      const formData = new FormData();
      formData.append('is_free', !currentStatus);
      await adminAPI.markFree(packId, formData);
      alert('Pack status updated!');
      fetchAllData();
    } catch (error) {
      alert('Failed to update: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
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
    <div className="min-h-screen bg-[#020204]">
      {/* Admin Header */}
      <div className="glass-panel m-4">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-2xl">🛠️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-400">SoundDrops Platform Control</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="font-semibold">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'creators', label: '👥 Creator Management', icon: '👥' },
            { id: 'content', label: '🎵 Content Management', icon: '🎵' },
            { id: 'emails', label: '📧 Email Collection', icon: '📧' },
            { id: 'upload', label: '⬆️ Upload Pack', icon: '⬆️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' 
                  : 'glass-panel hover:bg-white/10'
              }`}
              data-testid={`admin-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Unbounded, sans-serif' }}>
              Platform Overview
            </h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6" data-testid="metric-users">
                <p className="text-gray-400 text-sm mb-2">Total Users</p>
                <p className="text-4xl font-bold text-white">{stats.total_users}</p>
              </div>
              <div className="glass-panel p-6" data-testid="metric-creators">
                <p className="text-gray-400 text-sm mb-2">Active Creators</p>
                <p className="text-4xl font-bold text-violet-400">{stats.total_creators}</p>
              </div>
              <div className="glass-panel p-6" data-testid="metric-packs">
                <p className="text-gray-400 text-sm mb-2">Total Packs</p>
                <p className="text-4xl font-bold text-blue-400">{stats.total_packs}</p>
              </div>
              <div className="glass-panel p-6" data-testid="metric-subscriptions">
                <p className="text-gray-400 text-sm mb-2">Subscriptions</p>
                <p className="text-4xl font-bold text-green-400">{stats.total_subscriptions}</p>
              </div>
            </div>

            {/* Revenue Overview */}
            <div className="glass-panel p-6">
              <h3 className="text-2xl font-bold mb-6">Revenue Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Pack Sales</p>
                  <p className="text-3xl font-bold text-white">${stats.total_revenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">{stats.total_purchases} purchases</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Subscription Revenue</p>
                  <p className="text-3xl font-bold text-white">${stats.subscription_revenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">{stats.total_subscriptions} active</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Platform Earnings (10%)</p>
                  <p className="text-3xl font-bold text-green-400">${stats.platform_earnings.toFixed(2)}</p>
                  <p className="text-sm text-gray-400 mt-1">Your revenue</p>
                </div>
              </div>
            </div>

            {/* Creator Earnings */}
            <div className="glass-panel p-6">
              <h3 className="text-2xl font-bold mb-4">Creator Payouts (90%)</h3>
              <p className="text-3xl font-bold text-white mb-2">${stats.creator_earnings.toFixed(2)}</p>
              <p className="text-gray-400">Total paid to creators</p>
            </div>
          </div>
        )}

        {/* CREATOR MANAGEMENT TAB */}
        {activeTab === 'creators' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                Creator Management
              </h2>
              <div className="glass-panel px-4 py-2">
                <span className="text-gray-400">Pending: </span>
                <span className="text-2xl font-bold text-yellow-400">{creators.length}</span>
              </div>
            </div>

            <div className="glass-panel p-6 bg-gradient-to-r from-violet-500/10 to-purple-600/10 mb-6">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>How to Add Creators (Invitation-Only)</span>
              </h3>
              <div className="space-y-2 text-gray-300">
                <p>1. <strong>Manually invite creators</strong> - Share invite link or ask them to sign in</p>
                <p>2. <strong>They sign in with Google</strong> - Creates their account as regular user</p>
                <p>3. <strong>Approve them here</strong> - Change their role from user to creator</p>
                <p>4. <strong>They get access</strong> - Can upload packs and earn 90% revenue</p>
              </div>
              <div className="mt-4 p-3 bg-black/30 rounded-lg">
                <p className="text-sm text-gray-400">
                  <strong>Note:</strong> Public creator applications are disabled. You control who becomes a creator through manual approval.
                </p>
              </div>
            </div>

            {creators.length === 0 ? (
              <div className="glass-panel p-12 text-center">
                <p className="text-xl text-gray-400 mb-4">No pending creator applications</p>
                <p className="text-gray-500">Invite creators privately and approve them here once they sign up.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map(creator => (
                  <div key={creator.user_id} className="glass-panel p-6" data-testid="creator-application">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={creator.picture || 'https://via.placeholder.com/60'}
                        alt={creator.name}
                        className="w-16 h-16 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{creator.name}</h3>
                        <p className="text-sm text-gray-400 break-all">{creator.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied: {new Date(creator.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveCreator(creator.user_id)}
                      className="w-full btn-primary"
                      data-testid="approve-creator-btn"
                    >
                      ✓ Approve Creator
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTENT MANAGEMENT TAB */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Unbounded, sans-serif' }}>
              Content Management
            </h2>

            <div className="glass-panel p-4 mb-6">
              <p className="text-gray-400">Total Packs: <span className="text-2xl font-bold text-white ml-2">{allSamples.length}</span></p>
            </div>

            {allSamples.length === 0 ? (
              <div className="glass-panel p-12 text-center">
                <p className="text-xl text-gray-400">No sample packs uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allSamples.map(pack => (
                  <div key={pack.pack_id} className="glass-panel p-6" data-testid="content-pack">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{pack.title}</h3>
                        <p className="text-sm text-gray-400">by {pack.creator_name}</p>
                      </div>
                      {pack.is_free && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold">
                          FREE
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{pack.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-violet-500/20 rounded text-sm">{pack.category}</span>
                      <span className="text-lg font-bold">
                        {pack.is_free ? 'Free' : `$${pack.price}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>📥 {pack.download_count} downloads</span>
                      <span>{(pack.file_size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>

                    <button
                      onClick={() => handleToggleFree(pack.pack_id, pack.is_free)}
                      className="w-full btn-secondary text-sm"
                      data-testid="toggle-free-btn"
                    >
                      {pack.is_free ? '💰 Make Paid' : '🎁 Make Free'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EMAIL COLLECTION TAB */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                Email Collection
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const emails = allUsers.map(u => u.email).join(', ');
                    navigator.clipboard.writeText(emails);
                    alert('Emails copied to clipboard!');
                  }}
                  className="btn-secondary"
                  data-testid="copy-emails-button"
                >
                  📋 Copy All Emails
                </button>
                <button
                  onClick={() => {
                    const csv = 'Email,Name,Role,Joined\n' + allUsers.map(u => 
                      `${u.email},${u.name},${u.role},${new Date(u.created_at).toLocaleDateString()}`
                    ).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'sounddrops-users.csv';
                    a.click();
                  }}
                  className="btn-primary"
                  data-testid="export-csv-button"
                >
                  📥 Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm mb-2">Total Registered</p>
                <p className="text-4xl font-bold text-white">{allUsers.length}</p>
              </div>
              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm mb-2">Free Users</p>
                <p className="text-4xl font-bold text-blue-400">{allUsers.filter(u => u.role === 'user').length}</p>
              </div>
              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm mb-2">Creators</p>
                <p className="text-4xl font-bold text-violet-400">{allUsers.filter(u => u.role === 'creator' || u.role === 'admin').length}</p>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4">All Registered Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(user => (
                      <tr key={user.user_id} className="border-b border-white/5 hover:bg-white/5" data-testid="user-row">
                        <td className="py-3 px-4 font-mono text-sm">{user.email}</td>
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'creator' ? 'bg-violet-500/20 text-violet-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4">💡 Email Marketing Tips</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Export CSV and import to your email marketing platform (Mailchimp, ConvertKit, etc.)</li>
                <li>• Send updates about new sample packs and features</li>
                <li>• Announce special promotions and creator spotlights</li>
                <li>• Share production tips and tutorials</li>
              </ul>
            </div>
          </div>
        )}

        {/* UPLOAD PACK TAB */}
        {activeTab === 'upload' && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Unbounded, sans-serif' }}>
              Upload Sample Pack
            </h2>

            <div className="glass-panel p-8">
              <form onSubmit={handleUploadPack} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Creator Email</label>
                  <input
                    type="email"
                    placeholder="creator@example.com"
                    value={uploadForm.creatorEmail}
                    onChange={(e) => setUploadForm({ ...uploadForm, creatorEmail: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="upload-creator-email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Pack Title</label>
                  <input
                    type="text"
                    placeholder="Epic Trap Drums"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="upload-title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea
                    placeholder="High-quality trap drums for modern producers..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 h-24 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="upload-description"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Category</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                      data-testid="upload-category"
                    >
                      <option value="Drums">Drums</option>
                      <option value="Bass">Bass</option>
                      <option value="Synths">Synths</option>
                      <option value="FX">FX</option>
                      <option value="Vocals">Vocals</option>
                      <option value="Loops">Loops</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="9.99"
                      value={uploadForm.price}
                      onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                      required
                      data-testid="upload-price"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="trap, drums, 808, hard, modern"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                    data-testid="upload-tags"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer glass-panel p-4 rounded-lg hover:bg-white/10 transition">
                    <input
                      type="checkbox"
                      checked={uploadForm.isFree}
                      onChange={(e) => setUploadForm({ ...uploadForm, isFree: e.target.checked })}
                      className="w-5 h-5"
                      data-testid="upload-is-free"
                    />
                    <span className="font-semibold">🎁 Mark as Free Pack</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Audio File</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setUploadForm({ ...uploadForm, audioFile: e.target.files[0] })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="upload-audio-file"
                  />
                </div>

                <button type="submit" className="w-full btn-primary text-lg py-4 mt-6" data-testid="submit-upload">
                  ⬆️ Upload Pack
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
