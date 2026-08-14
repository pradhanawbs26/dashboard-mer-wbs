import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-slate-800 shadow-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-24 h-24 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-2 mx-auto flex items-center justify-center shadow-md">
            <img
              src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786687867/Logo_MER_q2erzz.png"
              alt="Logo MER"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              MER <span className="text-blue-600">Online</span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              PT. Wahana Bara Sentosa
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              NIK atau Username:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Masukkan NIK atau Username"
                value={inputIdentifier}
                onChange={(e) => setInputIdentifier(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Password:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3 rounded-xl shadow-md transition-all"
          >
            Masuk Aplikasi
          </button>
        </form>
      </div>
    </div>
  );
};
