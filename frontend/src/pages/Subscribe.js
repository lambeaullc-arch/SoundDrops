import { useNavigate } from 'react-router-dom';

const Subscribe = () => {
  const handleSubscribe = () => {
    // Store as subscription
    localStorage.setItem('registration_type', 'subscription');
    
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <span className="text-5xl">💎</span>
          </div>
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
              BEST VALUE
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            Premium Subscription
          </h1>
          <div className="mb-4">
            <span className="text-6xl font-bold text-violet-400">$5</span>
            <span className="text-2xl text-gray-400">/month</span>
          </div>
          <p className="text-xl text-gray-400">
            Unlimited downloads of all premium content
          </p>
        </div>

        <div className="glass-panel p-8 mb-6 border-2 border-violet-500">
          <h2 className="text-2xl font-bold mb-6 text-center">Premium Features:</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-600/10">
              <span className="text-3xl">🎵</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Unlimited Downloads</h3>
                <p className="text-gray-400">Download as many premium packs as you want - no limits!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
              <span className="text-3xl">✓</span>
              <div>
                <h3 className="font-bold text-lg mb-1">All Free Features</h3>
                <p className="text-gray-400">Everything from free registration plus unlimited premium access</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
              <span className="text-3xl">⭐</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Priority Support</h3>
                <p className="text-gray-400">Get faster responses and dedicated support</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
              <span className="text-3xl">🚀</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Early Access</h3>
                <p className="text-gray-400">Be the first to access new sample packs and features</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
              <span className="text-3xl">💰</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Best Value</h3>
                <p className="text-gray-400">Save money compared to buying packs individually</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            className="btn-primary text-xl w-full py-4 mb-4"
            data-testid="subscribe-button"
          >
            💎 Subscribe Now with Google
          </button>
          
          <p className="text-center text-gray-500 mb-4">
            Cancel anytime • No long-term commitment
          </p>

          <div className="border-t border-white/10 pt-4">
            <p className="text-center text-sm text-gray-400">
              Not ready to subscribe? <a href="/register" className="text-violet-400 hover:text-violet-300 underline">Start with free registration</a>
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 text-center">
          <h3 className="font-bold mb-2">💡 How it Works</h3>
          <div className="text-sm text-gray-400 space-y-2">
            <p>1. Sign in with Google to create your account</p>
            <p>2. Complete secure payment through Stripe ($5/month)</p>
            <p>3. Immediately access unlimited downloads</p>
            <p>4. Cancel anytime from your account settings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
