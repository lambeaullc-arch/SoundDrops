import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { samplesAPI } from '../utils/api';
import MiniWaveformPlayer from '../components/audio/MiniWaveformPlayer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Home = () => {
  const [featuredPacks, setFeaturedPacks] = useState([]);
  const [syncPacks, setSyncPacks] = useState([]);
  const [playingPack, setPlayingPack] = useState(null);

  const fetchFeatured = useCallback(async () => {
    try {
      const [featuredRes, syncRes] = await Promise.all([
        samplesAPI.list({ featured_only: true, limit: 3 }),
        samplesAPI.list({ sync_ready_only: true, limit: 3 })
      ]);
      setFeaturedPacks(featuredRes.data);
      setSyncPacks(syncRes.data);
    } catch (error) {
      console.error('Failed to fetch featured content:', error);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const getPreviewUrl = (pack) => {
    if (pack.preview_audio_path || pack.file_type !== 'zip') {
      return `${BACKEND_URL}/api/samples/${pack.pack_id}/preview`;
    }
    return null;
  };

  const getCoverUrl = (pack) => {
    if (pack.cover_image_path) {
      return `${BACKEND_URL}/api/samples/${pack.pack_id}/cover`;
    }
    return null;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-panel m-4">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                SoundDrops
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link to="/browse" className="text-gray-300 hover:text-white transition">
                Browse
              </Link>
              <Link to="/login" className="btn-primary" data-testid="home-login-button">
                Sign In
              </Link>
            </div>
          </div>
        </nav>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-6xl">🎵</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-bold mb-6" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            SoundDrops
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 mb-4">
            Premium music samples from top producers
          </p>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Browse thousands of professional samples, purchase individual packs, or subscribe for unlimited downloads at just $5/month
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/browse" 
              className="btn-primary text-lg px-8 py-4 inline-block"
              data-testid="browse-samples-button"
            >
              🎧 Browse Samples
            </Link>
            <Link 
              to="/register" 
              className="btn-secondary text-lg px-8 py-4 inline-block"
              data-testid="get-started-button"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            Why SoundDrops?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 text-center">
              <div className="text-5xl mb-4">🎹</div>
              <h3 className="text-2xl font-bold mb-3">Premium Quality</h3>
              <p className="text-gray-400">
                Professionally crafted samples from industry-leading producers and sound designers
              </p>
            </div>
            
            <div className="glass-panel p-8 text-center">
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-2xl font-bold mb-3">Flexible Pricing</h3>
              <p className="text-gray-400">
                Buy individual packs or subscribe for unlimited access at just $5/month
              </p>
            </div>
            
            <div className="glass-panel p-8 text-center">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold mb-3">Multiple Categories</h3>
              <p className="text-gray-400">
                Drums, Bass, Synths, FX, Vocals, Loops - everything you need for production
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 px-4 bg-gradient-to-br from-violet-600/10 to-purple-600/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Unbounded, sans-serif' }}>
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-400">
              Start free or get unlimited access for just $5/month
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="glass-panel p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🆓</div>
                <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                  Free Registration
                </h3>
                <p className="text-4xl font-bold text-violet-400 mb-2">$0</p>
                <p className="text-gray-400">Forever Free</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Download all free sample packs</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Create favorites & collections</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Email updates on new releases</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Preview all samples with waveform</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Purchase premium packs individually</span>
                </div>
              </div>

              <Link to="/register" className="btn-secondary w-full text-center block py-3">
                Get Started Free
              </Link>
              <p className="text-sm text-gray-500 text-center mt-3">
                No credit card required
              </p>
            </div>

            {/* Premium Plan */}
            <div className="glass-panel p-8 relative border-2 border-violet-500">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  BEST VALUE
                </span>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl mb-4">💎</div>
                <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                  Premium Subscription
                </h3>
                <p className="text-4xl font-bold text-violet-400 mb-2">$5</p>
                <p className="text-gray-400">Per Month</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="font-semibold">Unlimited downloads of ALL packs</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>All free account features</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Access to premium content</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Early access to new releases</span>
                </div>
              </div>

              <Link to="/subscribe" className="btn-primary w-full text-center block py-3">
                Subscribe Now
              </Link>
              <p className="text-sm text-gray-500 text-center mt-3">
                Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Sections Side by Side */}
      <div className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Featured Packs */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                    ⭐ Featured Packs
                  </h2>
                  <p className="text-gray-400">Hand-picked by our team</p>
                </div>
                <Link to="/browse?featured=true" className="text-violet-400 hover:text-violet-300 font-semibold">
                  View All →
                </Link>
              </div>

              {featuredPacks.length > 0 ? (
                <div className="space-y-4">
                  {featuredPacks.map(pack => {
                    const previewUrl = getPreviewUrl(pack);
                    const coverUrl = getCoverUrl(pack);
                    return (
                      <div key={pack.pack_id} className="glass-panel-hover p-4">
                        <div className="flex gap-4 mb-3">
                          {/* Cover Image */}
                          <Link to={`/pack/${pack.pack_id}`} className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 group">
                            {coverUrl ? (
                              <img 
                                src={coverUrl} 
                                alt={pack.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl">
                                🎵
                              </div>
                            )}
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500 text-black rounded text-xs font-bold">
                              FEATURED
                            </span>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to={`/pack/${pack.pack_id}`}>
                              <h3 className="font-bold text-lg mb-1 truncate hover:text-violet-400 transition">{pack.title}</h3>
                            </Link>
                            <p className="text-sm text-gray-400 mb-2">by {pack.creator_name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-1 bg-white/10 rounded text-xs">{pack.category}</span>
                              {pack.bpm && <span className="px-2 py-1 bg-white/10 rounded text-xs">{pack.bpm} BPM</span>}
                              {pack.is_free ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">FREE</span>
                              ) : (
                                <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs font-bold">${pack.price}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Waveform Player */}
                        {previewUrl && (
                          <MiniWaveformPlayer 
                            audioUrl={previewUrl}
                            packId={pack.pack_id}
                            isGlobalPlaying={playingPack}
                            onPlay={(id) => setPlayingPack(id)}
                            onStop={() => setPlayingPack(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-panel p-8 text-center">
                  <p className="text-gray-400">No featured packs yet</p>
                </div>
              )}
                              <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="inline-block px-2 py-1 bg-gradient-to-r from-violet-500 to-purple-600 rounded text-xs font-bold mb-1">
                              FEATURED
                            </span>
                            <Link to={`/pack/${pack.pack_id}`}>
                              <h3 className="font-bold text-lg mb-1 truncate hover:text-violet-400 transition">{pack.title}</h3>
                            </Link>
                            <p className="text-sm text-gray-400 mb-2">by {pack.creator_name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-1 bg-white/10 rounded text-xs">{pack.category}</span>
                              {pack.bpm && <span className="px-2 py-1 bg-white/10 rounded text-xs">{pack.bpm} BPM</span>}
                              {pack.is_free ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">FREE</span>
                              ) : (
                                <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs font-bold">${pack.price}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-panel p-8 text-center">
                  <p className="text-gray-400">No featured packs yet</p>
                </div>
              )}
            </div>

            {/* Sync-Ready Loops */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                    🎬 Sync-Ready Loops
                  </h2>
                  <p className="text-gray-400">Broadcast quality for film & TV</p>
                </div>
                <Link to="/sync" className="text-violet-400 hover:text-violet-300 font-semibold">
                  View All →
                </Link>
              </div>

              {syncPacks.length > 0 ? (
                <div className="space-y-4">
                  {syncPacks.map(pack => {
                    const previewUrl = getPreviewUrl(pack);
                    const coverUrl = getCoverUrl(pack);
                    return (
                      <div key={pack.pack_id} className="glass-panel-hover p-4">
                        <div className="flex gap-4">
                          {/* Cover Image with Play Button */}
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 group">
                            {coverUrl ? (
                              <img 
                                src={coverUrl} 
                                alt={pack.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl">
                                🎬
                              </div>
                            )}
                            {/* Play Button Overlay */}
                            {previewUrl && (
                              <button
                                onClick={() => togglePlay(pack.pack_id, previewUrl)}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                                data-testid={`play-btn-${pack.pack_id}`}
                              >
                                {playingPack === pack.pack_id ? (
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                  </svg>
                                ) : (
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                )}
                              </button>
                            )}
                            {playingPack === pack.pack_id && (
                              <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="inline-block px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded text-xs font-bold mb-1">
                              SYNC READY
                            </span>
                            <Link to={`/pack/${pack.pack_id}`}>
                              <h3 className="font-bold text-lg mb-1 truncate hover:text-violet-400 transition">{pack.title}</h3>
                            </Link>
                            <p className="text-sm text-gray-400 mb-2">by {pack.creator_name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {pack.sync_type && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-bold">{pack.sync_type}</span>}
                              {pack.bpm && <span className="px-2 py-1 bg-white/10 rounded text-xs">{pack.bpm} BPM</span>}
                              {pack.key && <span className="px-2 py-1 bg-white/10 rounded text-xs">{pack.key}</span>}
                              {pack.is_free ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">FREE</span>
                              ) : (
                                <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs font-bold">${pack.price}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-panel p-8 text-center">
                  <p className="text-gray-400">No sync-ready packs yet</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            Ready to elevate your music?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Start browsing thousands of premium samples today
          </p>
          <Link to="/browse" className="btn-primary text-lg px-8 py-4 inline-block">
            Explore Library
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="container mx-auto text-center text-gray-500">
          <p>&copy; 2025 SoundDrops. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
