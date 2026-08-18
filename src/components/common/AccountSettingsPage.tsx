import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ImageCropModal } from './ImageCropModal';
import {
  Camera,
  Upload,
  Trash2,
  CheckCircle,
  Image as ImageIcon,
  Lock,
  Key,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  AlertCircle,
  Save,
  ArrowLeft,
  Check,
  HardHat,
  Sparkles,
} from 'lucide-react';

interface AccountSettingsPageProps {
  initialTab?: 'password' | 'photo';
  onBack: () => void;
}

export const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({
  initialTab = 'password',
  onBack,
}) => {
  const { currentUser, updateEmployee } = useApp();

  const [activeTab, setActiveTab] = useState<'password' | 'photo'>(initialTab);

  // Photo State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUser?.photoUrl || null);
  const [photoToast, setPhotoToast] = useState<string | null>(null);
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passToast, setPassToast] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const currentActualPass = currentUser.password || (isAdmin ? 'admin123' : '123456');

  // --- PHOTO HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file maksimal 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setRawImageForCrop(result);
      setShowCropModal(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64: string) => {
    setPreviewUrl(croppedBase64);
  };

  const handleSavePhoto = () => {
    if (isAdmin) {
      alert('Administrator tidak menggunakan foto profil.');
      return;
    }

    const updated = {
      ...currentUser,
      photoUrl: previewUrl || undefined,
    };

    updateEmployee(updated);
    setPhotoToast('Foto profil berhasil diperbarui dan disimpan!');

    setTimeout(() => {
      setPhotoToast(null);
    }, 3000);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setRawImageForCrop(null);
  };

  // --- PASSWORD HANDLERS ---
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassToast(null);

    // Verify current password unless admin
    if (!isAdmin && currentPass !== currentActualPass) {
      setPassError('Password saat ini tidak sesuai. Pastikan Anda memasukkan password yang benar.');
      return;
    }

    if (!newPass || newPass.length < 4) {
      setPassError('Password baru minimal harus 4 karakter.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('Konfirmasi password baru tidak cocok dengan password baru.');
      return;
    }

    const updated = {
      ...currentUser,
      password: newPass,
    };

    updateEmployee(updated);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setPassToast('Password baru berhasil disimpan dan langsung aktif untuk akun Anda.');

    setTimeout(() => {
      setPassToast(null);
    }, 5000);
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'head_coach':
        return { label: 'Head Coach', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'group_leader':
        return { label: 'Group Leader', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'subordinate':
        return { label: 'Subordinat / Operator', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'Administrator', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Top Navigation & Back Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span>Kembali</span>
          </button>

          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 leading-tight">
              Pengaturan Akun & Keamanan
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola kata sandi dan profil akun pengguna
            </p>
          </div>
        </div>

        {/* User Badge Info */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center overflow-hidden shrink-0 border border-white shadow-2xs">
            {currentUser.photoUrl ? (
              <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{currentUser.name}</p>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">NIK: {currentUser.nik}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Password vs Photo) */}
      <div className="flex items-center p-1.5 bg-slate-100 border border-slate-200 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'password'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Key className="w-4 h-4 text-blue-600" />
          <span>Ubah Password Akun</span>
        </button>

        {currentUser.role !== 'admin' && (
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Ubah Foto Profil</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: UBAH PASSWORD */}
      {activeTab === 'password' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 text-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Form Ubah Password Akun
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Perbarui kata sandi login Anda secara mandiri dan aman
                </p>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {passToast && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start space-x-3 text-xs sm:text-sm animate-in fade-in duration-200">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-extrabold text-emerald-900">Berhasil Disimpan!</p>
                <p className="text-xs text-emerald-700 mt-0.5">{passToast}</p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {passError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-extrabold text-rose-900">Perhatian</p>
                <p className="text-xs text-rose-700 mt-0.5">{passError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4 sm:space-y-5 max-w-xl">
            {/* Input Password Saat Ini */}
            {!isAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>Password Saat Ini:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Wajib diisi</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 sm:py-3 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showCurrentPass ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Input Password Baru */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>Password Baru:</span>
                <span className="text-[11px] text-slate-400 font-normal">Minimal 4 karakter</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Masukkan password baru (minimal 4 karakter)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 sm:py-3 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showNewPass ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password Baru */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>Konfirmasi Password Baru:</span>
                <span className="text-[11px] text-slate-400 font-normal">Ulangi password baru</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 sm:py-3 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showConfirmPass ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Info Security Box */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Ketentuan Password Sistem:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800 text-[11px] sm:text-xs pl-1">
                <li>Password baru langsung aktif seketika setelah Anda menekan tombol simpan.</li>
                <li>Admin perusahaan memiliki wewenang memantau dan membantu pembaruan password melalui menu Master Data jika Anda lupa.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Password Baru</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-3 px-5 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 2: UBAH FOTO PROFIL */}
      {activeTab === 'photo' && currentUser.role !== 'admin' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 text-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Ubah Foto Profil & Avatar
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Sesuaikan foto profil Anda untuk ditampilkan pada sistem MER Online
                </p>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {photoToast && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start space-x-3 text-xs sm:text-sm animate-in fade-in duration-200">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-extrabold text-emerald-900">Berhasil Disimpan!</p>
                <p className="text-xs text-emerald-700 mt-0.5">{photoToast}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
            {/* Left: Avatar Big Preview */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-slate-100 border-4 border-white shadow-md overflow-hidden relative group flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#b42907] to-[#ff5e3a] text-white font-black text-4xl flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
              </div>

              <span className="text-[11px] text-slate-400 font-semibold">
                {previewUrl ? 'Foto Aktif' : 'Avatar Default'}
              </span>
            </div>

            {/* Right: Upload Controls & Actions */}
            <div className="flex-1 space-y-4 w-full">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Upload Foto dari Perangkat (Galeri / Kamera)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Format gambar JPG, PNG, atau WEBP (Maksimal 8MB). Sistem menyediakan alat pemotong foto otomatis agar proporsional.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-2xs flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih Foto Baru</span>
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Save Photo Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        imageSrc={rawImageForCrop}
        onClose={() => {
          setShowCropModal(false);
          setRawImageForCrop(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
