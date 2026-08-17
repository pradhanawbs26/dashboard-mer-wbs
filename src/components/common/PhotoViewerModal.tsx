import React from 'react';
import { Employee } from '../../types';
import { X, User, Briefcase, MapPin, Award, Shield } from 'lucide-react';

interface PhotoViewerModalProps {
  employee: Employee | null;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ employee, onClose }) => {
  if (!employee) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-white/40 text-slate-800 relative space-y-0 transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Close Button */}
        <div className="relative bg-gradient-to-br from-[#0c2340] via-[#091d36] to-[#061527] p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="font-label-caps text-xs font-black uppercase tracking-wider text-blue-200">
              Profil Karyawan PT. WBS
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Large Photo Display Container */}
        <div className="p-6 flex flex-col items-center text-center bg-slate-50/50">
          <div className="relative mb-4">
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
              {employee.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt={employee.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white font-black text-6xl flex flex-col items-center justify-center">
                  <span>{employee.name.charAt(0)}</span>
                  <span className="text-xs font-semibold text-blue-200 tracking-wider mt-1 opacity-80">
                    Foto Belum Diunggah
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name & NIK */}
          <h3 className="font-headline-lg text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {employee.name}
          </h3>
          <div className="flex items-center justify-center space-x-2 mt-1.5 flex-wrap gap-1">
            <span className="font-mono text-xs bg-slate-200/80 text-slate-800 font-bold px-2.5 py-0.5 rounded-full border border-slate-300/60">
              NIK: {employee.nik}
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full">
              {employee.role === 'subordinate'
                ? `Subordinat (${employee.category || 'Operator'})`
                : employee.role === 'group_leader'
                ? 'Group Leader'
                : employee.role === 'head_coach'
                ? 'Head Coach'
                : 'Admin'}
            </span>
          </div>

          {/* Detailed Info Card */}
          <div className="w-full mt-5 bg-white border border-slate-200/80 rounded-2xl p-4 text-left shadow-xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                Jabatan / Alat
              </span>
              <span className="font-bold text-slate-800 text-right">
                {employee.position || (employee.equipmentType ? `Operator ${employee.equipmentType}` : '-')}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Area Kerja
              </span>
              <span className="font-bold text-slate-800">
                {employee.department || 'Area Tambang'}
              </span>
            </div>

            {employee.groupLeaderName && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  Group Leader
                </span>
                <span className="font-bold text-slate-800">
                  {employee.groupLeaderName}
                </span>
              </div>
            )}

            {employee.equipmentType && (
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Spesialisasi Alat
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {employee.equipmentType}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Tutup Tampilan Foto
          </button>
        </div>
      </div>
    </div>
  );
};
