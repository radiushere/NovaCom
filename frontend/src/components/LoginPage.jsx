import React, { useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';
import TagSelector from './TagSelector';

const LoginPage = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: "", password: "", email: "", avatar: "", tags: ["Art", "Design"]
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegistering) {
      // REGISTER
      if (!formData.username || !formData.password) return setError("Missing fields");
      const tagsStr = formData.tags.join(',');

      const res = await callBackend('register', [
        formData.username, formData.email || "none", formData.password, formData.avatar || "none", tagsStr
      ]);

      if (res.error) setError(res.error);
      else onLogin(res.id); // Success -> Login
    } else {
      // LOGIN
      const res = await callBackend('login', [formData.username, formData.password]);
      if (res.error) setError(res.error);
      else onLogin(res.id);
    }
  };

  return (
    <div className="min-h-screen flex bg-museum-bg font-sans text-museum-text">
      {/* Left Side - Art/Branding */}
      <div className="hidden lg:flex w-1/2 bg-museum-stone items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80 grayscale hover:grayscale-0 transition-all duration-1000"></div>
        <div className="relative z-10 p-12 text-center">
          <h1 className="font-serif text-8xl text-white mb-4 tracking-tighter">MUSE</h1>
          <p className="text-white/80 text-lg tracking-widest uppercase">Curate Your Connections</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 animate-fade-in">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="font-serif text-4xl mb-2 text-museum-text">{isRegistering ? "Join the Gallery" : "Welcome Back"}</h2>
            <p className="text-museum-muted">Enter your details to access your collection.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-museum-muted mb-1">Username</label>
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-museum-stone py-3 text-museum-text focus:border-museum-text outline-none transition-colors placeholder-museum-stone"
                  placeholder="Enter your username"
                  value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-museum-muted mb-1">Password</label>
                <input
                  type="password"
                  className="w-full bg-transparent border-b border-museum-stone py-3 text-museum-text focus:border-museum-text outline-none transition-colors placeholder-museum-stone"
                  placeholder="Enter your password"
                  value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {isRegistering && (
                <div className="animate-slide-up space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-museum-muted mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full bg-transparent border-b border-museum-stone py-3 text-museum-text focus:border-museum-text outline-none transition-colors placeholder-museum-stone"
                      placeholder="name@example.com"
                      value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-museum-muted mb-1">Avatar URL</label>
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-museum-stone py-3 text-museum-text focus:border-museum-text outline-none transition-colors placeholder-museum-stone"
                      placeholder="https://..."
                      value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-museum-muted mb-2">Interests</label>
                    <TagSelector selectedTags={formData.tags} setSelectedTags={t => setFormData({ ...formData, tags: t })} />
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" className="w-full bg-museum-text text-white font-medium py-4 rounded-none hover:bg-black transition-all duration-300 tracking-widest uppercase text-xs">
              {isRegistering ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="text-center">
            <button
              className="text-sm text-museum-muted hover:text-museum-text underline decoration-1 underline-offset-4 transition-colors"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Already a member? Sign in" : "Not a member? Join now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;