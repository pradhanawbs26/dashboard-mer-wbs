import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Camera, Upload, Trash2, X, CheckCircle, Image as ImageIcon, User } from 'lucide-react';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateEmployee } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUser?.photoUrl || null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Ensure admin cannot upload photo according to rule
  const isAdmin = currentUser.role === 'admin';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    // Limit size to 5MB before canvas compression
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 400x400 for fast storage performance
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewUrl(compressedBase64);
        } else {
          setPreviewUrl(event.target?.result as string);
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (isAdmin) return;

    const updated = {
      ...currentUser,
      photoUrl: previewUrl || undefined,
    };

    updateEmployee(updated);
    setToastMsg('Foto profil berhasil diperbarui!');

    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 1200);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Upload Foto Profil
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser.name} • {currentUser.nik}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Restriction Notice */}
        {isAdmin ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-semibold text-center">
            Upload foto profil hanya berlaku untuk akun karyawan (Subordinat & Group Leader). Akun Administrator menggunakan sistem avatar bawaan.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toast feedback */}
            {toastMsg && (
              <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-2 shadow-sm animate-bounce">
                <CheckCircle className="w-4 h-4" />
                <span>{toastMsg}</span>
              </div>
            )}

            {/* Avatar Preview Box */}
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
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  title="Pilih Gambar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Format yang didukung: JPG, PNG, WEBP (Otomatis dikompresi)
              </p>
            </div>

            {/* Action Buttons */}
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
                disabled={isProcessing}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>{previewUrl ? 'Ganti Foto' : 'Pilih File'}</span>
              </button>

              {previewUrl ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Foto</span>
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

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Foto Profil</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
