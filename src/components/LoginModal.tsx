import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login } = useApp();

  const [inputIdentifier, setInputIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const success = login(inputIdentifier, password);
    if (!success) {
      setErrorMsg('NIK / Username atau Password tidak sesuai. Silakan coba lagi.');
    }
  };

  return (
    <div className="mesh-bg min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Glowing Blurs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#b42907]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#00668a]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-60 h-60 bg-[#7b41b4]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-6 sm:p-8 text-slate-800 shadow-2xl relative z-10 space-y-6 border border-white/80">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-white p-2.5 mx-auto flex items-center justify-center shadow-lg border border-slate-100 ring-4 ring-white/60">
            <img
              src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786687867/Logo_MER_q2erzz.png"
              alt="Logo MER"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Horizon
              </h1>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#b42907] bg-[#b42907]/10 px-2 py-0.5 rounded-full">
                MER Online
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              PT. Wahana Bara Sentosa
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
              NIK atau Username:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Masukkan NIK atau Username"
                value={inputIdentifier}
                onChange={(e) => setInputIdentifier(e.target.value)}
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b42907]/30 focus:border-[#b42907] font-mono text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
              Password:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b42907]/30 focus:border-[#b42907] text-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#b42907] to-[#d4380d] hover:opacity-95 text-white font-extrabold text-sm py-3 rounded-xl shadow-lg shadow-[#b42907]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Masuk Aplikasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-200/60">
          <span className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00668a]" />
            <span>Monthly Employee Review System</span>
          </span>
        </div>
      </div>
    </div>
  );
};
