import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, adminAPI, samplesAPI } from '../utils/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNav, setShowNav] = useState(false);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [creators, setCreators] = useState([]);
  const [allSamples, setAllSamples] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Drums',
    tags: '',
    price: '',
    creatorEmail: '',
    isFree: false,
    isFeatured: false,
    isSyncReady: false,
    syncType: '',
    bpm: '',
    key: '',
    audioFile: null,
    coverImage: null,
    previewAudio: null
  });
  const [editingPack, setEditingPack] = useState(null);

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
      const [statsRes, creatorsRes, samplesRes, usersRes, invitationsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.listCreators(),
        samplesAPI.list({}),
        adminAPI.getAllUsers(),
        adminAPI.listInvitations()
      ]);
      setStats(statsRes.data);
      setCreators(creatorsRes.data);
      setAllSamples(samplesRes.data);
      setAllUsers(usersRes.data);
      setInvitations(invitationsRes.data);
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
      formData.append('is_featured', uploadForm.isFeatured);
      formData.append('is_sync_ready', uploadForm.isSyncReady);
      if (uploadForm.isSyncReady && uploadForm.syncType) {
        formData.append('sync_type', uploadForm.syncType);
      }
      if (uploadForm.bpm) {
        formData.append('bpm', uploadForm.bpm);
      }
      if (uploadForm.key) {
        formData.append('key', uploadForm.key);
      }
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
        isFeatured: false,
        isSyncReady: false,
        syncType: '',
        bpm: '',
        key: '',
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

  const handleToggleFeatured = async (packId, currentStatus) => {
    try {
      const formData = new FormData();
      formData.append('is_featured', !currentStatus);
      await adminAPI.markFeatured(packId, formData);
      alert(`Pack ${!currentStatus ? 'marked as featured' : 'removed from featured'}!`);
      fetchAllData();
    } catch (error) {
      alert('Failed to update: ' + error.message);
    }
  };

  const handleToggleSyncReady = async (packId, currentStatus, currentSyncType) => {
    if (!currentStatus) {
      // Marking as sync-ready, ask for type
      const syncType = prompt('Select Sync Type:\n1. Sports\n2. Film\n3. Cinematic\n4. Broadcast\n\nEnter the type name:');
      if (!syncType) return;
      
      const validTypes = ['Sports', 'Film', 'Cinematic', 'Broadcast'];
      const selectedType = validTypes.find(t => t.toLowerCase() === syncType.toLowerCase());
      
      if (!selectedType) {
        alert('Invalid sync type. Please enter: Sports, Film, Cinematic, or Broadcast');
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append('is_sync_ready', true);
        formData.append('sync_type', selectedType);
        await adminAPI.markSyncReady(packId, formData);
        alert(`Pack marked as sync-ready (${selectedType})!`);
        fetchAllData();
      } catch (error) {
        alert('Failed to update: ' + error.message);
      }
    } else {
      // Unmarking as sync-ready
      try {
        const formData = new FormData();
        formData.append('is_sync_ready', false);
        await adminAPI.markSyncReady(packId, formData);
        alert('Pack removed from sync-ready!');
        fetchAllData();
      } catch (error) {
        alert('Failed to update: ' + error.message);
      }
    }
  };

  const handleUpdateMetadata = async (packId, currentBpm, currentKey) => {
    const bpmInput = prompt('Enter BPM (leave empty to skip):', currentBpm || '');
    const keyInput = prompt('Enter Key (e.g., Am, C, F#) (leave empty to skip):', currentKey || '');
    
    if (bpmInput === null && keyInput === null) return; // User cancelled
    
    try {
      const formData = new FormData();
      if (bpmInput && bpmInput.trim()) {
        formData.append('bpm', parseInt(bpmInput));
      }
      if (keyInput && keyInput.trim()) {
        formData.append('key', keyInput.trim());
      }
      
      await adminAPI.updateMetadata(packId, formData);
      alert('Metadata updated!');
      fetchAllData();
    } catch (error) {
      alert('Failed to update metadata: ' + error.message);
    }
  };

  const handlePromoteToCreator = async (userId, userName) => {
    if (!window.confirm(`Promote ${userName} to creator?`)) return;
    
    try {
      await adminAPI.promoteUser(userId);
      alert('User promoted to creator!');
      fetchAllData();
    } catch (error) {
      alert('Failed to promote: ' + error.message);
    }
  };

  const handleEditPack = async (pack) => {
    setEditingPack(pack);
  };

  const handleSaveEdit = async () => {
    if (!editingPack) return;
    
    try {
      const formData = new FormData();
      formData.append('title', editingPack.title);
      formData.append('description', editingPack.description);
      formData.append('category', editingPack.category);
      formData.append('tags', editingPack.tags?.join(', ') || '');
      formData.append('price', editingPack.price);
      formData.append('is_free', editingPack.is_free);
      formData.append('is_featured', editingPack.is_featured);
      formData.append('is_sync_ready', editingPack.is_sync_ready);
      if (editingPack.sync_type) {
        formData.append('sync_type', editingPack.sync_type);
      }
      if (editingPack.bpm) {
        formData.append('bpm', editingPack.bpm);
      }
      if (editingPack.key) {
        formData.append('key', editingPack.key);
      }
      
      await adminAPI.updatePack(editingPack.pack_id, formData);
      alert('Pack updated successfully!');
      setEditingPack(null);
      fetchAllData();
    } catch (error) {
      alert('Failed to update: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeletePack = async (packId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    
    try {
      await adminAPI.deletePack(packId);
      alert('Pack deleted successfully!');
      fetchAllData();
    } catch (error) {
      alert('Failed to delete: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleInviteCreator = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail) {
      alert('Please enter an email address');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('email', inviteEmail);
      
      await adminAPI.inviteCreator(formData);
      alert(`Creator invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
      fetchAllData();
    } catch (error) {
      alert('Failed to send invitation: ' + (error.response?.data?.detail || error.message));
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
            { id: 'payment', label: '💳 Payment Settings', icon: '💳' },
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

            {/* Invite Creator Section */}
            <div className="glass-panel p-6 bg-gradient-to-r from-violet-500/20 to-purple-600/20">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>✉️</span>
                <span>Invite Creator</span>
              </h3>
              <form onSubmit={handleInviteCreator} className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="creator@email.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                  data-testid="invite-email-input"
                />
                <button
                  type="submit"
                  className="btn-primary whitespace-nowrap"
                  data-testid="send-invite-button"
                >
                  📧 Send Invite
                </button>
              </form>
              <p className="text-sm text-gray-400 mt-3">
                When they sign up with this email, they'll automatically become a creator with full access.
              </p>
            </div>

            {/* Invited Creators */}
            {invitations.length > 0 && (
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-4">Pending Invitations ({invitations.filter(i => i.status === 'pending').length})</h3>
                <div className="space-y-2">
                  {invitations.filter(i => i.status === 'pending').map(inv => (
                    <div key={inv.invitation_id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg" data-testid="pending-invitation">
                      <div>
                        <p className="font-semibold">{inv.email}</p>
                        <p className="text-xs text-gray-500">
                          Invited {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-panel p-6 bg-gradient-to-r from-violet-500/10 to-purple-600/10 mb-6">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>How Creator Invitations Work</span>
              </h3>
              <div className="space-y-2 text-gray-300">
                <p>1. <strong>Enter creator's email</strong> and click "Send Invite"</p>
                <p>2. <strong>They sign up</strong> using that email address</p>
                <p>3. <strong>Automatically become creator</strong> with full dashboard access</p>
                <p>4. <strong>Start uploading</strong> packs and earning 90% revenue immediately</p>
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

            {/* Edit Pack Modal */}
            {editingPack && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="glass-panel p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <h3 className="text-2xl font-bold mb-4">Edit Pack</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Title</label>
                      <input
                        type="text"
                        value={editingPack.title}
                        onChange={(e) => setEditingPack({...editingPack, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Description</label>
                      <textarea
                        value={editingPack.description}
                        onChange={(e) => setEditingPack({...editingPack, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 h-20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingPack.price}
                          onChange={(e) => setEditingPack({...editingPack, price: parseFloat(e.target.value)})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Category</label>
                        <select
                          value={editingPack.category}
                          onChange={(e) => setEditingPack({...editingPack, category: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                        >
                          <option value="Drums">Drums</option>
                          <option value="Bass">Bass</option>
                          <option value="Synths">Synths</option>
                          <option value="FX">FX</option>
                          <option value="Vocals">Vocals</option>
                          <option value="Loops">Loops</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">BPM</label>
                        <input
                          type="number"
                          value={editingPack.bpm || ''}
                          onChange={(e) => setEditingPack({...editingPack, bpm: e.target.value ? parseInt(e.target.value) : null})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                          placeholder="120"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Key</label>
                        <input
                          type="text"
                          value={editingPack.key || ''}
                          onChange={(e) => setEditingPack({...editingPack, key: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                          placeholder="Am, C, F#"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPack.is_free}
                          onChange={(e) => setEditingPack({...editingPack, is_free: e.target.checked, price: e.target.checked ? 0 : editingPack.price})}
                          className="w-5 h-5"
                        />
                        <span>Free Pack</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPack.is_featured}
                          onChange={(e) => setEditingPack({...editingPack, is_featured: e.target.checked})}
                          className="w-5 h-5"
                        />
                        <span>Featured Pack</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPack.is_sync_ready}
                          onChange={(e) => setEditingPack({...editingPack, is_sync_ready: e.target.checked})}
                          className="w-5 h-5"
                        />
                        <span>Sync Ready</span>
                      </label>
                      {editingPack.is_sync_ready && (
                        <div>
                          <label className="block text-sm font-semibold mb-2">Sync Type</label>
                          <select
                            value={editingPack.sync_type || ''}
                            onChange={(e) => setEditingPack({...editingPack, sync_type: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                          >
                            <option value="">Select Type</option>
                            <option value="Sports">Sports</option>
                            <option value="Film">Film</option>
                            <option value="Cinematic">Cinematic</option>
                            <option value="Broadcast">Broadcast</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button onClick={handleSaveEdit} className="btn-primary flex-1">Save Changes</button>
                      <button onClick={() => setEditingPack(null)} className="btn-secondary flex-1">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      <div className="flex gap-1 flex-wrap justify-end">
                        {pack.is_free && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold">
                            FREE
                          </span>
                        )}
                        {pack.is_featured && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold">
                            FEATURED
                          </span>
                        )}
                        {pack.is_sync_ready && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                            SYNC
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{pack.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-violet-500/20 rounded text-sm">{pack.category}</span>
                      <span className="text-lg font-bold">
                        {pack.is_free ? 'Free' : `$${pack.price}`}
                      </span>
                    </div>

                    {(pack.bpm || pack.key) && (
                      <div className="flex gap-2 mb-3 text-sm">
                        {pack.bpm && <span className="px-2 py-1 bg-white/10 rounded">{pack.bpm} BPM</span>}
                        {pack.key && <span className="px-2 py-1 bg-white/10 rounded">{pack.key}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>📥 {pack.download_count} downloads</span>
                      <span>{(pack.file_size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEditPack(pack)}
                        className="btn-secondary text-sm"
                        data-testid="edit-pack-btn"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(pack.pack_id, pack.is_featured)}
                        className={`text-sm rounded-lg py-2 ${pack.is_featured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-400'}`}
                        data-testid="toggle-featured-btn"
                      >
                        ⭐ {pack.is_featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button
                        onClick={() => handleToggleSyncReady(pack.pack_id, pack.is_sync_ready, pack.sync_type)}
                        className={`text-sm rounded-lg py-2 ${pack.is_sync_ready ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}
                        data-testid="toggle-sync-btn"
                      >
                        🎬 {pack.is_sync_ready ? 'Unsync' : 'Sync'}
                      </button>
                      <button
                        onClick={() => handleDeletePack(pack.pack_id, pack.title)}
                        className="text-sm rounded-lg py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        data-testid="delete-pack-btn"
                      >
                        🗑️ Delete
                      </button>
                    </div>
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
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
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
                        <td className="py-3 px-4">
                          {user.role === 'user' && (
                            <button
                              onClick={() => handlePromoteToCreator(user.user_id, user.name)}
                              className="px-3 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded text-xs font-semibold transition"
                              data-testid="promote-creator-btn"
                            >
                              ⬆️ Make Creator
                            </button>
                          )}
                          {user.role === 'creator' && (
                            <span className="text-xs text-gray-500">Creator</span>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-xs text-gray-500">Admin</span>
                          )}
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

        {/* PAYMENT SETTINGS TAB */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Unbounded, sans-serif' }}>
              Payment Settings
            </h2>

            {/* Revenue Split Overview */}
            <div className="glass-panel p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>💰</span>
                <span>Revenue Split Model</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-green-400 mb-2">Creator Earnings (90%)</h4>
                  <p className="text-gray-300 text-sm">Creators keep 90% of all sales revenue from their sample packs</p>
                  <p className="text-2xl font-bold text-white mt-2">${stats?.creator_earnings?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-gray-400">Total paid to creators</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-violet-400 mb-2">Platform Fee (10%)</h4>
                  <p className="text-gray-300 text-sm">Platform takes 10% to cover hosting, processing, and development</p>
                  <p className="text-2xl font-bold text-white mt-2">${stats?.platform_earnings?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-gray-400">Platform revenue</p>
                </div>
              </div>
            </div>

            {/* Payment Processing */}
            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🔒</span>
                <span>Payment Processing</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                  <div>
                    <h4 className="font-semibold">Stripe Integration</h4>
                    <p className="text-sm text-gray-400">Secure payment processing for all transactions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 text-sm font-semibold">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                  <div>
                    <h4 className="font-semibold">SSL Security</h4>
                    <p className="text-sm text-gray-400">All payments encrypted and secure</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 text-sm font-semibold">Enabled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Settings */}
            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🔄</span>
                <span>Subscription Plans</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-lg p-4">
                  <h4 className="text-lg font-bold mb-2">Pro Plan</h4>
                  <p className="text-3xl font-bold text-white mb-2">$9.99<span className="text-sm text-gray-400">/month</span></p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Unlimited downloads</li>
                    <li>• Early access to new packs</li>
                    <li>• Exclusive creator content</li>
                    <li>• Commercial license included</li>
                  </ul>
                  <div className="mt-4 text-sm">
                    <span className="text-gray-400">Active subscribers: </span>
                    <span className="font-bold text-white">{stats?.total_subscriptions || 0}</span>
                  </div>
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="text-lg font-bold mb-2">Free Plan</h4>
                  <p className="text-3xl font-bold text-white mb-2">$0<span className="text-sm text-gray-400">/month</span></p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Limited free downloads</li>
                    <li>• Access to free sample packs</li>
                    <li>• Basic community features</li>
                    <li>• Personal use license</li>
                  </ul>
                  <div className="mt-4 text-sm">
                    <span className="text-gray-400">Free users: </span>
                    <span className="font-bold text-white">{allUsers?.filter(u => u.role === 'user').length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Information */}
            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📊</span>
                <span>Creator Payouts</span>
              </h3>
              <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Total Sales Revenue</p>
                    <p className="text-3xl font-bold text-white">${stats?.total_revenue?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Creator Share (90%)</p>
                    <p className="text-3xl font-bold text-green-400">${stats?.creator_earnings?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Platform Share (10%)</p>
                    <p className="text-3xl font-bold text-violet-400">${stats?.platform_earnings?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-black/30 rounded-lg">
                  <h4 className="font-semibold mb-2">💡 Payout Schedule</h4>
                  <p className="text-sm text-gray-400">
                    Creators are paid monthly via Stripe Connect. Payments are processed automatically on the 1st of each month for the previous month's earnings.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Analytics */}
            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📈</span>
                <span>Payment Analytics</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats?.total_purchases || 0}</p>
                  <p className="text-sm text-gray-400">Total Purchases</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">${(stats?.total_revenue / (stats?.total_purchases || 1))?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-gray-400">Avg. Order Value</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">${stats?.subscription_revenue?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-gray-400">Subscription Revenue</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-violet-400">{((stats?.total_subscriptions / (stats?.total_users || 1)) * 100)?.toFixed(1) || '0.0'}%</p>
                  <p className="text-sm text-gray-400">Conversion Rate</p>
                </div>
              </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">BPM (optional)</label>
                    <input
                      type="number"
                      placeholder="120"
                      value={uploadForm.bpm}
                      onChange={(e) => setUploadForm({ ...uploadForm, bpm: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                      data-testid="upload-bpm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Key (optional)</label>
                    <input
                      type="text"
                      placeholder="Am, C, F#"
                      value={uploadForm.key}
                      onChange={(e) => setUploadForm({ ...uploadForm, key: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                      data-testid="upload-key"
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

                <div className="space-y-3">
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
                  
                  <label className="flex items-center gap-3 cursor-pointer glass-panel p-4 rounded-lg hover:bg-white/10 transition">
                    <input
                      type="checkbox"
                      checked={uploadForm.isFeatured}
                      onChange={(e) => setUploadForm({ ...uploadForm, isFeatured: e.target.checked })}
                      className="w-5 h-5"
                      data-testid="upload-is-featured"
                    />
                    <span className="font-semibold">⭐ Mark as Featured Pack</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer glass-panel p-4 rounded-lg hover:bg-white/10 transition">
                    <input
                      type="checkbox"
                      checked={uploadForm.isSyncReady}
                      onChange={(e) => setUploadForm({ ...uploadForm, isSyncReady: e.target.checked })}
                      className="w-5 h-5"
                      data-testid="upload-is-sync-ready"
                    />
                    <span className="font-semibold">🎬 Mark as Sync Ready (Broadcast Quality)</span>
                  </label>
                  
                  {uploadForm.isSyncReady && (
                    <div className="ml-8">
                      <label className="block text-sm font-semibold mb-2">Sync Type</label>
                      <select
                        value={uploadForm.syncType}
                        onChange={(e) => setUploadForm({ ...uploadForm, syncType: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                        data-testid="upload-sync-type"
                      >
                        <option value="">Select Type</option>
                        <option value="Sports">Sports</option>
                        <option value="Film">Film</option>
                        <option value="Cinematic">Cinematic</option>
                        <option value="Broadcast">Broadcast</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Audio File or ZIP Archive</label>
                  <input
                    type="file"
                    accept="audio/*,.zip"
                    onChange={(e) => setUploadForm({ ...uploadForm, audioFile: e.target.files[0] })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                    required
                    data-testid="upload-audio-file"
                  />
                  <p className="text-sm text-gray-400 mt-2">Supports MP3, WAV, and ZIP files containing multiple samples</p>
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
