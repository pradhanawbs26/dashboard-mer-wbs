import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ImageCropModal } from './ImageCropModal';
import {
  Camera,
  Upload,
  Trash2,
  X,
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
  Crop,
} from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'photo' | 'password';
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'photo',
}) => {
  const { currentUser, updateEmployee } = useApp();

  const [activeTab, setActiveTab] = useState<'photo' | 'password'>(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

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
  const [passError, setPassError] = useState<string | null>(null);
  const [passToast, setPassToast] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

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
      // reset input value so re-selecting same file triggers change
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
    setPhotoToast('Foto profil berhasil diperbarui!');

    setTimeout(() => {
      setPhotoToast(null);
    }, 2500);
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
      setPassError('Password saat ini tidak sesuai.');
      return;
    }

    if (!newPass || newPass.length < 4) {
      setPassError('Password baru minimal 4 karakter.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('Konfirmasi password baru tidak cocok.');
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
    setPassToast('Password berhasil diubah & disimpan! Catatan: Admin dapat melihat password ini di Master Data.');

    setTimeout(() => {
      setPassToast(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Pengaturan Akun ({currentUser.role === 'group_leader' ? 'Group Leader' : currentUser.role === 'subordinate' ? 'Subordinat' : 'Admin'})
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser.name} • NIK: {currentUser.nik}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex-1 py-2.5 text-center border-b-2 flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'photo'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Foto Profil</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2.5 text-center border-b-2 flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Ubah Password</span>
          </button>
        </div>

        {/* TAB 1: PROFILE PHOTO */}
        {activeTab === 'photo' && (
          <div className="space-y-4">
            {isAdmin ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-semibold text-center">
                Upload foto profil berlaku untuk karyawan (Subordinat & Group Leader). Akun Admin menggunakan avatar sistem.
              </div>
            ) : (
              <>
                {photoToast && (
                  <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-2 shadow-sm animate-bounce">
                    <CheckCircle className="w-4 h-4" />
                    <span>{photoToast}</span>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center space-y-3 py-2">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-md bg-slate-100 flex items-center justify-center">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600 text-white font-black text-4xl flex items-center justify-center">
                          {currentUser.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title="Pilih Gambar"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center">
                    Gunakan foto formal dengan wajah terlihat jelas (JPG/PNG/WEBP).
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{previewUrl ? 'Ganti Foto' : 'Pilih File'}</span>
                  </button>

                  {previewUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRawImageForCrop(previewUrl);
                        setShowCropModal(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Crop className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sesuaikan (Crop)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="bg-slate-50 text-slate-300 font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Belum ada foto</span>
                    </button>
                  )}
                </div>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Foto Profil</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSavePhoto}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Foto</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* TAB 2: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
            {passError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passToast && (
              <div className="bg-emerald-600 text-white text-xs font-bold p-3 rounded-xl flex items-center space-x-2 shadow-sm animate-bounce">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passToast}</span>
              </div>
            )}

            {!isAdmin && (
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Password Saat Ini:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password saat ini"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Password Baru:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password baru (min. 4 karakter)"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Konfirmasi Password Baru:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  placeholder="Ulangi password baru"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Ketentuan Password System:</span>
              </p>
              <p>• Password baru langsung aktif setelah disimpan.</p>
              <p>• Admin perusahaan memiliki wewenang memantau dan memperbarui password di Master Data.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Password Baru</span>
            </button>
          </form>
        )}
      </div>

      {/* Image Cropper Modal */}
      <ImageCropModal
        imageSrc={rawImageForCrop}
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
