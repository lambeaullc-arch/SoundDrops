import { Link } from 'react-router-dom';

const Home = () => {
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
              to="/login" 
              className="btn-secondary text-lg px-8 py-4 inline-block"
              data-testid="get-started-button"
            >
              Get Started
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

      {/* For Creators Section */}
      <div className="py-24 px-4 bg-gradient-to-br from-violet-600/10 to-purple-600/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            For Creators
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Share your sounds with thousands of producers and earn 90% revenue on every sale
          </p>
          <Link to="/login" className="btn-primary text-lg px-8 py-4 inline-block">
            Become a Creator
          </Link>
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
