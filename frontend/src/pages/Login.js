import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (planType) => {
    // Store selection in localStorage for after auth callback
    if (planType) {
      localStorage.setItem('registration_type', planType);
    }
    
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <span className="text-5xl">🎵</span>
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            SoundDrops
          </h1>
          <p className="text-xl text-gray-400">
            Choose your plan and start accessing premium samples
          </p>
        </div>

        {/* Two Options Side by Side */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Free Registration Option */}
          <div 
            className="glass-panel p-8 hover:scale-102 transition-all"
            data-testid="free-option-card"
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🆓</div>
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                Free Registration
              </h2>
              <p className="text-4xl font-bold text-violet-400 mb-2">$0</p>
              <p className="text-gray-400">Forever Free</p>
            </div>

            <div className="space-y-3 mb-6">
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

            <button
              onClick={() => handleLogin('free')}
              className="w-full btn-secondary text-lg py-4"
              data-testid="free-register-button"
            >
              🆓 Register Free with Google
            </button>

            <div className="pt-4 border-t border-white/10 mt-4">
              <p className="text-sm text-gray-500 text-center">
                No credit card required • Upgrade anytime
              </p>
            </div>
          </div>

          {/* Subscription Option */}
          <div 
            className="glass-panel p-8 hover:scale-102 transition-all relative border-2 border-violet-500"
            data-testid="subscription-option-card"
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                BEST VALUE
              </span>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl mb-4">💎</div>
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                Premium Subscription
              </h2>
              <p className="text-4xl font-bold text-violet-400 mb-2">$5</p>
              <p className="text-gray-400">Per Month</p>
            </div>

            <div className="space-y-3 mb-6">
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

            <button
              onClick={() => handleLogin('subscription')}
              className="w-full btn-primary text-lg py-4"
              data-testid="subscription-register-button"
            >
              💎 Subscribe with Google
            </button>

            <div className="pt-4 border-t border-white/10 mt-4">
              <p className="text-sm text-gray-500 text-center">
                Cancel anytime • No commitment
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Trusted by thousands of producers worldwide • Secure Google authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;