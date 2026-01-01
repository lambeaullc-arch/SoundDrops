import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
          <span className="text-5xl">🎵</span>
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Unbounded, sans-serif' }}>
          SoundDrops
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Register free to access free samples and get updates
        </p>
        
        <div className="glass-panel p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">Free Registration Includes:</h2>
          <div className="text-left space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span>Download all free sample packs</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span>Create favorites & collections</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span>Email updates on new releases</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span>Preview all samples with waveform</span>
            </div>
          </div>
          
          <button
            onClick={handleLogin}
            className="btn-primary text-lg w-full py-4 mb-4"
            data-testid="login-page-button"
          >
            🆓 Register Free with Google
          </button>
          
          <p className="text-sm text-gray-500">
            No credit card required. Upgrade to $5/month anytime for unlimited downloads.
          </p>
        </div>
        
        <p className="text-sm text-gray-500">
          By registering, you'll receive email updates about new samples and features.
        </p>
      </div>
    </div>
  );
};

export default Login;