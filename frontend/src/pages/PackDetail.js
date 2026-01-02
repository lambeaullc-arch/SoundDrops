import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import SimpleAudioPlayer from '../components/audio/SimpleAudioPlayer';
import { samplesAPI } from '../utils/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PackDetail = () => {
  const { packId } = useParams();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPack = useCallback(async () => {
    try {
      const response = await samplesAPI.get(packId);
      setPack(response.data);
    } catch (error) {
      console.error('Failed to fetch pack:', error);
    } finally {
      setLoading(false);
    }
  }, [packId]);

  useEffect(() => {
    fetchPack();
  }, [fetchPack]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Pack Not Found</h1>
          <Link to="/browse" className="btn-primary">Browse All Packs</Link>
        </div>
      </div>
    );
  }

  const coverUrl = pack.cover_image_path 
    ? `${BACKEND_URL}/api/samples/${pack.pack_id}/cover`
    : 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop';
  
  const previewUrl = pack.preview_audio_path || pack.file_type !== 'zip'
    ? `${BACKEND_URL}/api/samples/${pack.pack_id}/preview`
    : null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Back link */}
          <Link to="/browse" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Browse
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cover Image & Audio Player */}
            <div className="space-y-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden glass-panel">
                <img 
                  src={coverUrl} 
                  alt={pack.title}
                  className="w-full h-full object-cover"
                  data-testid="pack-cover-image"
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {pack.is_featured && (
                    <span className="px-3 py-1 bg-yellow-500/90 text-black rounded-full text-xs font-bold">
                      FEATURED
                    </span>
                  )}
                  {pack.is_sync_ready && (
                    <span className="px-3 py-1 bg-blue-500/90 text-white rounded-full text-xs font-bold">
                      SYNC READY
                    </span>
                  )}
                  {pack.is_free && (
                    <span className="px-3 py-1 bg-green-500/90 text-white rounded-full text-xs font-bold">
                      FREE
                    </span>
                  )}
                </div>
              </div>

              {/* Audio Player */}
              {previewUrl && (
                <div className="glass-panel p-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-400">Audio Preview</h3>
                  <SimpleAudioPlayer audioUrl={previewUrl} packTitle={pack.title} />
                </div>
              )}
            </div>

            {/* Pack Details */}
            <div className="space-y-6">
              <div>
                <p className="text-violet-400 font-semibold mb-2">{pack.category}</p>
                <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }} data-testid="pack-title">
                  {pack.title}
                </h1>
                <p className="text-gray-400">by <span className="text-white">{pack.creator_name}</span></p>
              </div>

              <p className="text-gray-300 text-lg leading-relaxed" data-testid="pack-description">
                {pack.description}
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3">
                {pack.bpm && (
                  <span className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                    <span className="text-gray-400">BPM:</span> {pack.bpm}
                  </span>
                )}
                {pack.key && (
                  <span className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                    <span className="text-gray-400">Key:</span> {pack.key}
                  </span>
                )}
                {pack.sync_type && (
                  <span className="px-4 py-2 bg-blue-500/20 rounded-lg text-sm text-blue-400">
                    {pack.sync_type}
                  </span>
                )}
                <span className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                  <span className="text-gray-400">Size:</span> {(pack.file_size / 1024 / 1024).toFixed(1)} MB
                </span>
                <span className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                  <span className="text-gray-400">Type:</span> {pack.file_type === 'zip' ? 'ZIP Archive' : 'Audio'}
                </span>
              </div>

              {/* Tags */}
              {pack.tags && pack.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pack.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Price & Action */}
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="text-3xl font-bold" data-testid="pack-price">
                    {pack.is_free ? 'Free' : `$${pack.price.toFixed(2)}`}
                  </span>
                </div>
                
                <button 
                  className="w-full btn-primary text-lg py-4"
                  data-testid="download-btn"
                >
                  {pack.is_free ? '📥 Download Free' : '🛒 Purchase & Download'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  {pack.download_count} downloads
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="glass-panel p-4">
                  <p className="text-2xl font-bold">{pack.download_count}</p>
                  <p className="text-xs text-gray-400">Downloads</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-2xl font-bold">{pack.file_type === 'zip' ? 'Multi' : '1'}</p>
                  <p className="text-xs text-gray-400">Files</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-2xl font-bold">{(pack.file_size / 1024 / 1024).toFixed(0)}</p>
                  <p className="text-xs text-gray-400">MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackDetail;
