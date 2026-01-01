import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WaveformPlayer from '../components/audio/WaveformPlayer';
import { samplesAPI, subscriptionAPI, purchaseAPI, favoritesAPI, authAPI } from '../utils/api';

const Browse = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const [user, setUser] = useState(null);

  const categories = ['Drums', 'Bass', 'Synths', 'FX', 'Vocals', 'Loops'];

  useEffect(() => {
    fetchSamples();
    fetchSubscription();
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      // User not logged in, that's fine
      setUser(null);
    }
  };

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;
      const response = await samplesAPI.list(params);
      setSamples(response.data);
    } catch (error) {
      console.error('Failed to fetch samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionAPI.getStatus();
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handlePurchase = async (packId) => {
    if (!user) {
      alert('Please sign in to purchase');
      window.location.href = '/login';
      return;
    }
    try {
      const response = await purchaseAPI.createCheckout(packId, window.location.origin);
      window.location.href = response.data.url;
    } catch (error) {
      alert('Purchase failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please sign in to subscribe');
      window.location.href = '/login';
      return;
    }
    try {
      const response = await subscriptionAPI.createCheckout(window.location.origin);
      window.location.href = response.data.url;
    } catch (error) {
      alert('Subscription failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddFavorite = async (packId) => {
    if (!user) {
      alert('Please sign in to add favorites');
      window.location.href = '/login';
      return;
    }
    try {
      await favoritesAPI.add(packId);
      alert('Added to favorites!');
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  };

  const handleDownload = async (packId, title) => {
    if (!user) {
      alert('Please sign in to download');
      window.location.href = '/login';
      return;
    }
    try {
      const response = await samplesAPI.download(packId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Download failed: ' + (error.response?.data?.detail || 'Please purchase or subscribe'));
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Unbounded, sans-serif' }}>
              Browse Samples
            </h1>
            <p className="text-xl text-gray-400">Discover premium samples from top producers</p>
          </div>

          {/* Subscription Banner */}
          {!subscription?.active && (
            <div className="glass-panel p-6 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">📬 Free Registration</h3>
                  <p className="text-gray-400">
                    Sign up free to download free packs and get email updates. Upgrade to $5/month for unlimited downloads of all premium packs!
                  </p>
                </div>
                <div className="flex gap-3">
                  {!user && (
                    <button 
                      onClick={() => window.location.href = '/login'} 
                      className="btn-secondary whitespace-nowrap"
                      data-testid="register-free-button"
                    >
                      🆓 Register Free
                    </button>
                  )}
                  <button onClick={handleSubscribe} className="btn-primary whitespace-nowrap" data-testid="subscribe-button">
                    💎 Subscribe $5/month
                  </button>
                </div>
              </div>
            </div>
          )}

          {subscription?.active && (
            <div className="glass-panel p-4 mb-8 text-center bg-gradient-to-r from-violet-500/20 to-purple-600/20">
              <p className="text-green-400 font-semibold">✓ You have unlimited downloads!</p>
            </div>
          )}

          {/* Search & Filters */}
          <div className="glass-panel p-6 mb-8">
            <input
              type="text"
              placeholder="Search samples..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-violet-500"
              data-testid="search-input"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory('')}
                className={`px-4 py-2 rounded-lg transition ${!category ? 'bg-violet-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                data-testid="category-all"
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg transition ${category === cat ? 'bg-violet-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                  data-testid={`category-${cat.toLowerCase()}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Samples Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {samples.map((sample) => (
                <div key={sample.pack_id} className="glass-panel-hover p-6" data-testid="sample-card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{sample.title}</h3>
                      <p className="text-sm text-gray-400">by {sample.creator_name}</p>
                    </div>
                    <button
                      onClick={() => handleAddFavorite(sample.pack_id)}
                      className="text-gray-400 hover:text-red-500 transition"
                      data-testid="favorite-button"
                    >
                      ♥️
                    </button>
                  </div>

                  <p className="text-gray-400 text-sm mb-4">{sample.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-violet-500/20 rounded text-xs">{sample.category}</span>
                    {sample.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs">{tag}</span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedSample(sample)}
                    className="w-full btn-secondary mb-3"
                    data-testid="preview-button"
                  >
                    🎧 Preview
                  </button>

                  {sample.is_free ? (
                    <button
                      onClick={() => handleDownload(sample.pack_id, sample.title)}
                      className="w-full btn-primary"
                      data-testid="download-free-button"
                    >
                      Download Free
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePurchase(sample.pack_id)}
                        className="flex-1 btn-primary"
                        data-testid="purchase-button"
                      >
                        ${sample.price}
                      </button>
                      {subscription?.active && (
                        <button
                          onClick={() => handleDownload(sample.pack_id, sample.title)}
                          className="flex-1 btn-secondary"
                          data-testid="download-subscribed-button"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {sample.download_count} downloads
                  </p>
                </div>
              ))}
            </div>
          )}

          {samples.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <p>No samples found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedSample && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSample(null)}>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedSample.title}</h2>
                  <p className="text-gray-400">by {selectedSample.creator_name}</p>
                </div>
                <button onClick={() => setSelectedSample(null)} className="text-gray-400 hover:text-white text-2xl">
                  ×
                </button>
              </div>
              <WaveformPlayer
                audioUrl={`${process.env.REACT_APP_BACKEND_URL}${selectedSample.audio_file_path}`}
                packTitle={selectedSample.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Browse;