import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Employee, SubordinateCategory, UserRole, HeavyEquipmentType, WORK_AREAS } from '../../types';
import { HEAVY_EQUIPMENT_LIST } from '../../data/initialData';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { ImageCropModal } from '../common/ImageCropModal';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  HardHat,
  Building,
  ShieldCheck,
  Award,
  Key,
  Eye,
  EyeOff,
  Lock,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Cloud,
  RefreshCw,
  Camera,
  Crop,
  Maximize2,
} from 'lucide-react';

export const MasterData: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    bulkImportEmployees,
    isSyncingFirebase,
    syncAllDataToFirebase,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Excel Bulk Import States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedEmployees, setParsedEmployees] = useState<(Omit<Employee, 'id'> & { isUpdate?: boolean })[]>([]);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State to toggle password visibility in table per employee ID
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Subordinate & Employee Photo Viewer Popup state
  const [photoViewingEmp, setPhotoViewingEmp] = useState<Employee | null>(null);

  // Modal Form Password & Photo states
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nik: string;
    name: string;
    password: string;
    role: UserRole;
    category: SubordinateCategory;
    equipmentType?: HeavyEquipmentType;
    department: string;
    groupLeaderId?: string;
    position: string;
    photoUrl?: string;
  }>({
    nik: '',
    name: '',
    password: '',
    role: 'subordinate',
    category: 'Operator',
    equipmentType: 'Excavator',
    department: 'CY',
    groupLeaderId: '',
    position: '',
    photoUrl: undefined,
  });

  const togglePasswordVisibility = (empId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const downloadEmployeeTemplate = () => {
    const templateRows = [
      {
        NIK: '1010',
        Nama_Karyawan: 'Dedi Kurniawan',
        Password: '123456',
        Peran_Role: 'subordinate',
        Kategori: 'Operator',
        Tipe_Alat_Berat: 'Excavator',
        Departemen_Sektor: 'CY',
        Jabatan: 'Operator Excavator',
        NIK_Atasan: '1001',
      },
      {
        NIK: '1011',
        Nama_Karyawan: 'Suryadi Jaya',
        Password: '123456',
        Peran_Role: 'subordinate',
        Kategori: 'Operator',
        Tipe_Alat_Berat: 'Dump Truck',
        Departemen_Sektor: 'Hauling',
        Jabatan: 'Driver DT Hauling',
        NIK_Atasan: '1002',
      },
      {
        NIK: '3005',
        Nama_Karyawan: 'Eko Prasetyo',
        Password: '123456',
        Peran_Role: 'subordinate',
        Kategori: 'Nonom',
        Tipe_Alat_Berat: '',
        Departemen_Sektor: 'Stockpile',
        Jabatan: 'Checker Stockpile',
        NIK_Atasan: '1003',
      },
      {
        NIK: '1001',
        Nama_Karyawan: 'Dharmawan Kustanto',
        Password: '123456',
        Peran_Role: 'group_leader',
        Kategori: '',
        Tipe_Alat_Berat: '',
        Departemen_Sektor: 'CY',
        Jabatan: 'Group Leader CY',
        NIK_Atasan: '1000',
      },
      {
        NIK: '1000',
        Nama_Karyawan: 'Bambang Supriyanto',
        Password: '123456',
        Peran_Role: 'head_coach',
        Kategori: '',
        Tipe_Alat_Berat: '',
        Departemen_Sektor: 'CY',
        Jabatan: 'Head Coach Operasional CY & Hauling',
        NIK_Atasan: '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 24 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Database_Karyawan');
    XLSX.writeFile(wb, 'Template_Database_Karyawan_MER.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        if (!data || data.length === 0) {
          setUploadError('File Excel tidak berisi data karyawan yang valid.');
          return;
        }

        const headCoachesList = employees.filter((emp) => emp.role === 'head_coach');
        const groupLeadersList = employees.filter((emp) => emp.role === 'group_leader');

        const parsed: (Omit<Employee, 'id'> & { isUpdate?: boolean })[] = [];

        data.forEach((row, idx) => {
          const nikRaw = row['NIK'] || row['nik'] || row['Nip'] || row['NIP'] || '';
          const nik = String(nikRaw).trim();
          if (!nik) return;

          const name = String(row['Nama_Karyawan'] || row['Nama'] || row['name'] || `Karyawan ${idx + 1}`).trim();
          const password = String(row['Password'] || row['password'] || '123456').trim();

          const roleRaw = String(row['Peran_Role'] || row['Role'] || row['role'] || 'subordinate').toLowerCase();
          let role: UserRole = 'subordinate';
          if (roleRaw.includes('admin')) role = 'admin';
          else if (roleRaw.includes('head') || roleRaw.includes('coach')) role = 'head_coach';
          else if (roleRaw.includes('group') || roleRaw.includes('leader')) role = 'group_leader';

          const categoryRaw = String(row['Kategori'] || row['category'] || 'Operator').toLowerCase();
          const category: SubordinateCategory =
            role === 'subordinate' && (categoryRaw.includes('nonom') || categoryRaw.includes('non'))
              ? 'Nonom'
              : 'Operator';

          const equipmentTypeRaw = String(row['Tipe_Alat_Berat'] || row['Alat'] || row['equipmentType'] || 'Excavator');
          let equipmentType: HeavyEquipmentType | undefined = undefined;
          if (role === 'subordinate' && category === 'Operator') {
            const matchedEq = HEAVY_EQUIPMENT_LIST.find((eq) => eq.toLowerCase() === equipmentTypeRaw.toLowerCase());
            equipmentType = (matchedEq as HeavyEquipmentType) || 'Excavator';
          }

          const department = String(row['Departemen_Sektor'] || row['Departemen'] || row['department'] || 'CY');
          const position = String(
            row['Jabatan'] ||
            row['position'] ||
            (role === 'group_leader'
              ? `Group Leader ${department}`
              : role === 'head_coach'
              ? `Head Coach ${department}`
              : category === 'Operator'
              ? `Operator ${equipmentType || 'Alat'}`
              : 'Karyawan Non-Operator')
          );

          const atasanNik = String(
            row['NIK_Atasan'] || row['NIK_Group_Leader'] || row['GroupLeaderId'] || row['glNik'] || ''
          ).trim();

          let groupLeaderName: string | undefined = undefined;
          if (role === 'group_leader') {
            const matchedHc = headCoachesList.find((hc) => hc.nik === atasanNik);
            groupLeaderName = matchedHc ? matchedHc.name : undefined;
          } else if (role === 'subordinate') {
            const matchedGl = groupLeadersList.find((g) => g.nik === atasanNik);
            groupLeaderName = matchedGl ? matchedGl.name : undefined;
          }

          const isExisting = employees.some((e) => e.nik === nik);

          parsed.push({
            nik,
            name,
            password,
            role,
            category: role === 'subordinate' ? category : 'Nonom',
            equipmentType,
            department,
            position,
            groupLeaderId: role === 'subordinate' || role === 'group_leader' ? atasanNik || undefined : undefined,
            groupLeaderName,
            isUpdate: isExisting,
          });
        });

        if (parsed.length === 0) {
          setUploadError('Tidak ada baris data dengan NIK yang valid.');
          return;
        }

        setParsedEmployees(parsed);
      } catch (err: any) {
        setUploadError(`Gagal membaca file Excel: ${err?.message || 'Format file tidak sesuai'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (parsedEmployees.length === 0) return;

    await bulkImportEmployees(parsedEmployees);
    setUploadSuccessMessage(`Berhasil mengunggah & menyinkronkan ${parsedEmployees.length} data karyawan ke sistem & database cloud (Firebase)!`);
    setParsedEmployees([]);
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadSuccessMessage(null);
    }, 1500);
  };

  const groupLeaders = employees.filter((e) => e.role === 'group_leader');
  const headCoaches = employees.filter((e) => e.role === 'head_coach');

  const handleRoleChange = (newRole: UserRole) => {
    setFormData((prev) => {
      let newCategory: SubordinateCategory = prev.category;
      let newPosition = prev.position;
      let newGlId = prev.groupLeaderId;
      let newEquipment = prev.equipmentType;
      let newDepartment = prev.department;

      if (newRole === 'group_leader') {
        newCategory = 'Nonom';
        newEquipment = undefined;
        newPosition =
          !prev.position ||
          prev.position.includes('Operator') ||
          prev.position.includes('Head Coach') ||
          prev.position.includes('Administrator')
            ? `Group Leader ${newDepartment}`
            : prev.position;
        newGlId = headCoaches[0]?.nik || '';
      } else if (newRole === 'head_coach') {
        newCategory = 'Nonom';
        newEquipment = undefined;
        newPosition =
          !prev.position ||
          prev.position.includes('Operator') ||
          prev.position.includes('Group Leader') ||
          prev.position.includes('Administrator')
            ? `Head Coach ${newDepartment}`
            : prev.position;
        newGlId = '';
      } else if (newRole === 'admin') {
        newCategory = 'Nonom';
        newEquipment = undefined;
        newDepartment = 'Management';
        newPosition = 'Administrator Sistem';
        newGlId = '';
      } else if (newRole === 'subordinate') {
        newCategory = 'Operator';
        newEquipment = 'Excavator';
        newPosition =
          !prev.position ||
          prev.position.includes('Group Leader') ||
          prev.position.includes('Head Coach') ||
          prev.position.includes('Administrator')
            ? 'Operator Heavy Machinery'
            : prev.position;
        newGlId = groupLeaders[0]?.nik || '';
      }

      return {
        ...prev,
        role: newRole,
        category: newCategory,
        position: newPosition,
        groupLeaderId: newGlId,
        equipmentType: newEquipment,
        department: newDepartment,
      };
    });
  };

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
    setFormData((prev) => ({
      ...prev,
      photoUrl: croppedBase64,
    }));
  };

  const openAddModal = () => {
    setEditingEmp(null);
    setFormData({
      nik: `100${employees.length + 10}`,
      name: '',
      password: '123456',
      role: 'subordinate',
      category: 'Operator',
      equipmentType: 'Excavator',
      department: 'CY',
      groupLeaderId: groupLeaders[0]?.nik || '',
      position: 'Operator Heavy Machinery',
      photoUrl: undefined,
    });
    setShowModalPassword(false);
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      nik: emp.nik,
      name: emp.name,
      password: emp.password || (emp.role === 'admin' ? 'admin123' : '123456'),
      role: emp.role,
      category: emp.category,
      equipmentType: emp.equipmentType,
      department: emp.department,
      groupLeaderId: emp.groupLeaderId || '',
      position: emp.position,
      photoUrl: emp.photoUrl,
    });
    setShowModalPassword(false);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let atasanName: string | undefined = undefined;
    let finalGroupLeaderId = formData.groupLeaderId;

    if (formData.role === 'group_leader') {
      const selectedHc = headCoaches.find((hc) => hc.nik === formData.groupLeaderId);
      atasanName = selectedHc ? selectedHc.name : undefined;
    } else if (formData.role === 'subordinate') {
      const selectedGl = groupLeaders.find((g) => g.nik === formData.groupLeaderId);
      atasanName = selectedGl ? selectedGl.name : undefined;
    } else {
      finalGroupLeaderId = undefined;
      atasanName = undefined;
    }

    const payload = {
      ...formData,
      groupLeaderId: finalGroupLeaderId || undefined,
      groupLeaderName: atasanName,
      category: formData.role === 'subordinate' ? formData.category : ('Nonom' as SubordinateCategory),
      equipmentType:
        formData.role === 'subordinate' && formData.category === 'Operator'
          ? formData.equipmentType
          : undefined,
    };

    if (editingEmp) {
      updateEmployee({
        ...editingEmp,
        ...payload,
      });
    } else {
      addEmployee(payload);
    }

    setShowModal(false);
  };

  const handleDelete = (emp: Employee) => {
    if (confirm(`Hapus karyawan ${emp.name} (NIK: ${emp.nik}) dari master data?`)) {
      deleteEmployee(emp.id);
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.nik.includes(searchTerm) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || e.role === roleFilter;
    const matchesCategory =
      categoryFilter === 'ALL' || e.category === categoryFilter;

    return matchesSearch && matchesRole && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Pengelolaan Master Data Karyawan</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {employees.length} Karyawan (Admin, Group Leader, Operator & Nonom)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={async () => {
              setSyncStatusMsg(null);
              const res = await syncAllDataToFirebase();
              setSyncStatusMsg({
                type: res.success ? 'success' : 'error',
                text: res.message,
              });
              setTimeout(() => setSyncStatusMsg(null), 7000);
            }}
            disabled={isSyncingFirebase}
            className={`${
              isSyncingFirebase
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer'
            } border font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all`}
            title="Sinkronkan seluruh data karyawan saat ini ke database Firebase Firestore"
          >
            {isSyncingFirebase ? (
              <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 text-indigo-600" />
            )}
            <span>{isSyncingFirebase ? 'Menyinkronkan...' : 'Sinkron ke Cloud (Firebase)'}</span>
          </button>

          <button
            onClick={downloadEmployeeTemplate}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            title="Download Template Format Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download Template Excel</span>
          </button>

          <button
            onClick={() => {
              setParsedEmployees([]);
              setUploadError(null);
              setUploadSuccessMessage(null);
              setShowUploadModal(true);
            }}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            title="Upload Database Karyawan dari File Excel"
          >
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Upload Database Excel</span>
          </button>

          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncStatusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between transition-all ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {syncStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{syncStatusMsg.text}</span>
          </div>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NIK, atau departemen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value="admin">Admin</option>
            <option value="head_coach">Head Coach</option>
            <option value="group_leader">Group Leader</option>
            <option value="subordinate">Subordinate</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Operator">Operator Alat Berat</option>
            <option value="Nonom">Nonom (Non-Operator)</option>
          </select>
        </div>
      </div>

      {/* Employees Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Karyawan</th>
                <th className="p-3.5">Password</th>
                <th className="p-3.5">Peran / Kategori</th>
                <th className="p-3.5">Alat Berat / Jabatan</th>
                <th className="p-3.5">Area Kerja</th>
                <th className="p-3.5">Group Leader</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                const empPass = emp.password || (emp.role === 'admin' ? 'admin123' : '123456');
                const isPassVisible = !!visiblePasswords[emp.id];

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setPhotoViewingEmp(emp)}
                          className="relative group/avatar w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 shadow-xs hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                          title="Klik untuk melihat foto profil besar"
                        >
                          {emp.photoUrl ? (
                            <img
                              src={emp.photoUrl}
                              alt={emp.name}
                              className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform"
                            />
                          ) : (
                            emp.name.charAt(0)
                          )}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="w-3 h-3" />
                          </div>
                        </button>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{emp.name}</p>
                          <span className="text-[10px] text-blue-600 font-mono">
                            NIK: {emp.nik}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-semibold">
                          {isPassVisible ? empPass : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(emp.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title={isPassVisible ? 'Sembunyikan Password' : 'Lihat Password'}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                  <td className="p-3.5">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded w-max ${
                          emp.role === 'admin'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : emp.role === 'head_coach'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : emp.role === 'group_leader'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {emp.role === 'head_coach' ? 'HEAD COACH' : emp.role.toUpperCase().replace('_', ' ')}
                      </span>
                      {emp.role === 'subordinate' && (
                        <span className="text-[10px] text-slate-500">
                          {emp.category}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <p className="font-semibold text-slate-800">{emp.position}</p>
                    {emp.equipmentType && (
                      <span className="text-[10px] text-blue-600 flex items-center space-x-1 mt-0.5 font-medium">
                        <HardHat className="w-3 h-3" />
                        <span>{emp.equipmentType}</span>
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-slate-600 font-medium">
                    {emp.department}
                  </td>

                  <td className="p-3.5 text-slate-500">
                    {emp.groupLeaderName ? (
                      <span className="text-slate-800 font-medium">
                        {emp.role === 'group_leader' ? 'HC: ' : 'GL: '}{emp.groupLeaderName}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Master Data"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {emp.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 text-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingEmp ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              {/* Profile Photo Upload & Preview */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {formData.photoUrl ? (
                      <img
                        src={formData.photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{formData.name ? formData.name.charAt(0).toUpperCase() : '?'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Foto Profil Karyawan</p>
                    <p className="text-[10px] text-slate-500">JPG, PNG, WEBP (Mendukung Crop)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-lg border border-blue-200 flex items-center space-x-1 transition-all cursor-pointer text-[11px]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{formData.photoUrl ? 'Ganti' : 'Pilih Foto'}</span>
                  </button>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawImageForCrop(formData.photoUrl || null);
                        setShowCropModal(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded-lg border border-slate-300 transition-all cursor-pointer"
                      title="Sesuaikan Posisi Foto (Crop)"
                    >
                      <Crop className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photoUrl: undefined }))}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold p-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  NIK (Nomor Induk Karyawan):
                </label>
                <input
                  type="text"
                  required
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Password Akun:
                </label>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                    placeholder="Password akun"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Peran / Role Selector */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Peran Akun (Role):
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="subordinate">Subordinate (Operator & Non-OM)</option>
                  <option value="group_leader">Group Leader (Pengawas Lapangan)</option>
                  <option value="head_coach">Head Coach (Pembina / Managerial)</option>
                  <option value="admin">Admin (Administrator Sistem)</option>
                </select>
              </div>

              {/* KHUSUS SUBORDINATE: Kategori MER & Tipe Alat */}
              {formData.role === 'subordinate' && (
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Kategori MER:
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const cat = e.target.value as SubordinateCategory;
                          setFormData({
                            ...formData,
                            category: cat,
                            equipmentType: cat === 'Operator' ? 'Excavator' : undefined,
                            position:
                              cat === 'Operator'
                                ? 'Operator Excavator'
                                : 'Karyawan Non-Operator',
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="Operator">Operator (Alat Berat)</option>
                        <option value="Nonom">Nonom (Non-Operator / Staff / Helper)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Area Kerja:
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({ ...formData, department: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        {WORK_AREAS.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.category === 'Operator' && (
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Tipe Pengoperasian Alat Berat:
                      </label>
                      <select
                        value={formData.equipmentType}
                        onChange={(e) => {
                          const eq = e.target.value as HeavyEquipmentType;
                          setFormData({
                            ...formData,
                            equipmentType: eq,
                            position: `Operator ${eq}`,
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        {HEAVY_EQUIPMENT_LIST.map((eq) => (
                          <option key={eq} value={eq}>
                            {eq}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Jabatan / Posisi Kerja:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      placeholder="Contoh: Operator Excavator, Helper CY, dll."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Atasan Langsung (Group Leader):
                    </label>
                    <select
                      value={formData.groupLeaderId}
                      onChange={(e) =>
                        setFormData({ ...formData, groupLeaderId: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">-- Pilih Group Leader Pembina --</option>
                      {groupLeaders.map((gl) => (
                        <option key={gl.id} value={gl.nik}>
                          {gl.name} (NIK: {gl.nik}) - Area: {gl.department}
                        </option>
                      ))}
                    </select>
                    {groupLeaders.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        * Belum ada data Group Leader terdaftar. Anda dapat menambahkannya nanti.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* KHUSUS GROUP LEADER */}
              {formData.role === 'group_leader' && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Konfigurasi Group Leader</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Area Kerja / Sektor Pengawasan:
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => {
                        const dept = e.target.value;
                        setFormData({
                          ...formData,
                          department: dept,
                          position: `Group Leader ${dept}`,
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      {WORK_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Jabatan / Posisi:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      placeholder="Contoh: Group Leader CY, Group Leader Hauling"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Head Coach (Atasan Langsung / Pembina):
                    </label>
                    <select
                      value={formData.groupLeaderId}
                      onChange={(e) =>
                        setFormData({ ...formData, groupLeaderId: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">-- Pilih Head Coach Pembina --</option>
                      {headCoaches.map((hc) => (
                        <option key={hc.id} value={hc.nik}>
                          {hc.name} (NIK: {hc.nik}) - Area: {hc.department}
                        </option>
                      ))}
                    </select>
                    {headCoaches.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        * Belum ada Head Coach terdaftar. Anda dapat menambahkan Head Coach terlebih dahulu atau mengaturnya nanti.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* KHUSUS HEAD COACH */}
              {formData.role === 'head_coach' && (
                <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3 space-y-3">
                  <div className="flex items-center space-x-2 text-purple-800 font-bold">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Konfigurasi Head Coach</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Area Kerja / Sektor Pembinaan:
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => {
                        const dept = e.target.value;
                        setFormData({
                          ...formData,
                          department: dept,
                          position: `Head Coach ${dept}`,
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-600 cursor-pointer"
                    >
                      <option value="All Area">All Area (Seluruh Sektor)</option>
                      {WORK_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Jabatan / Posisi:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      placeholder="Contoh: Head Coach Operasional & Produksi"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

              {/* KHUSUS ADMIN */}
              {formData.role === 'admin' && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800 font-bold">
                    <Building className="w-4 h-4 text-amber-600" />
                    <span>Konfigurasi Administrator</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Departemen / Divisi:
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-600"
                      placeholder="Management / IT"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Jabatan:
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-600"
                      placeholder="Administrator Sistem"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-sm"
                >
                  Simpan Master Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 text-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Upload Database Karyawan via Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Impor file .xlsx / .xls / .csv untuk memperbarui database karyawan secara masal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction & Download Template Bar */}
            <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-purple-900">Petunjuk Format Kolom Excel:</p>
                <p className="text-purple-700 leading-relaxed">
                  Kolom wajib: <code className="bg-purple-100 text-purple-900 px-1 rounded">NIK</code>,{' '}
                  <code className="bg-purple-100 text-purple-900 px-1 rounded">Nama_Karyawan</code>,{' '}
                  <code className="bg-purple-100 text-purple-900 px-1 rounded">Peran_Role</code> (subordinate/group_leader/admin),{' '}
                  <code className="bg-purple-100 text-purple-900 px-1 rounded">Kategori</code> (Operator/Nonom),{' '}
                  <code className="bg-purple-100 text-purple-900 px-1 rounded">Departemen_Sektor</code>,{' '}
                  <code className="bg-purple-100 text-purple-900 px-1 rounded">NIK_Group_Leader</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadEmployeeTemplate}
                className="bg-white hover:bg-purple-100 text-purple-700 font-bold border border-purple-300 px-3 py-2 rounded-lg flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>Unduh Template</span>
              </button>
            </div>

            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/30 rounded-2xl p-6 text-center transition-all">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                id="employee-file-input"
                className="hidden"
              />
              <label htmlFor="employee-file-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800">
                    Klik untuk memilih file Excel atau drag & drop
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">Format didukung: .xlsx, .xls, .csv</p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Success Message */}
            {uploadSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center space-x-2 font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {/* Preview Parsed Table */}
            {parsedEmployees.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Preview Data Karyawan ({parsedEmployees.length} Baris Terdeteksi):
                  </span>
                  <span className="text-slate-500">
                    {parsedEmployees.filter((p) => p.isUpdate).length} Update |{' '}
                    {parsedEmployees.filter((p) => !p.isUpdate).length} Karyawan Baru
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 font-bold text-slate-600 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">NIK</th>
                        <th className="p-2.5">Nama Karyawan</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Area Kerja</th>
                        <th className="p-2.5">GL (Atasan)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedEmployees.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            {emp.isUpdate ? (
                              <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
                                UPDATE
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">
                                BARU
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-bold font-mono text-slate-900">{emp.nik}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{emp.name}</td>
                          <td className="p-2.5 uppercase font-mono text-[10px] text-slate-600">{emp.role}</td>
                          <td className="p-2.5 font-semibold text-slate-700">
                            {emp.category} {emp.equipmentType ? `(${emp.equipmentType})` : ''}
                          </td>
                          <td className="p-2.5 text-slate-600">{emp.department}</td>
                          <td className="p-2.5 text-slate-600">
                            {emp.groupLeaderName ? emp.groupLeaderName : emp.groupLeaderId ? `NIK: ${emp.groupLeaderId}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={parsedEmployees.length === 0}
                onClick={handleConfirmImport}
                className={`font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer ${
                  parsedEmployees.length > 0
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan & Import Database ({parsedEmployees.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subordinate & Employee Profile Photo Viewer Modal */}
      <PhotoViewerModal
        employee={photoViewingEmp}
        onClose={() => setPhotoViewingEmp(null)}
      />

      {/* Admin Photo Crop Modal */}
      <ImageCropModal
        imageSrc={rawImageForCrop}
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
