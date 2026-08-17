import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DynamicParameter, SubordinateCategory, MeritRule, DemeritRule } from '../../types';
import {
  Sliders,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const ParameterConfigEngine: React.FC = () => {
  const {
    operatorParameters,
    nonomParameters,
    meritRules,
    demeritRules,
    updateOperatorParameters,
    updateNonomParameters,
    updateMeritRules,
    updateDemeritRules,
  } = useApp();

  const [activeCategoryTab, setActiveCategoryTab] = useState<SubordinateCategory>('Operator');

  // Local state copies for dynamic editing
  const [opParams, setOpParams] = useState<DynamicParameter[]>(operatorParameters);
  const [nonParams, setNonParams] = useState<DynamicParameter[]>(nonomParameters);
  const [mRules, setMRules] = useState<MeritRule[]>(meritRules);
  const [dRules, setDRules] = useState<DemeritRule[]>(demeritRules);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentParams = activeCategoryTab === 'Operator' ? opParams : nonParams;

  // Calculate current total weight
  const totalWeight = currentParams.reduce((acc, p) => acc + p.weight, 0);

  const handleWeightChange = (id: string, weightVal: number) => {
    if (activeCategoryTab === 'Operator') {
      setOpParams((prev) =>
        prev.map((p) => (p.id === id ? { ...p, weight: weightVal } : p))
      );
    } else {
      setNonParams((prev) =>
        prev.map((p) => (p.id === id ? { ...p, weight: weightVal } : p))
      );
    }
  };

  const handleNameChange = (id: string, nameVal: string) => {
    if (activeCategoryTab === 'Operator') {
      setOpParams((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: nameVal } : p))
      );
    } else {
      setNonParams((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: nameVal } : p))
      );
    }
  };

  const handleCriterionChange = (id: string, level: 1 | 2 | 3 | 4, val: string) => {
    if (activeCategoryTab === 'Operator') {
      setOpParams((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, criteria: { ...p.criteria, [level]: val } }
            : p
        )
      );
    } else {
      setNonParams((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, criteria: { ...p.criteria, [level]: val } }
            : p
        )
      );
    }
  };

  const handleThresholdChange = (id: string, field: string, val: any) => {
    const updateFn = (prev: DynamicParameter[]) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const currentTh = p.autoThreshold || {
          metricType: 'generic_numeric' as const,
          minL4: 90,
          minL3: 80,
          minL2: 70,
        };
        return {
          ...p,
          autoThreshold: {
            ...currentTh,
            [field]: val,
          },
        };
      });

    if (activeCategoryTab === 'Operator') {
      setOpParams(updateFn);
    } else {
      setNonParams(updateFn);
    }
  };

  const addParameter = () => {
    const newP: DynamicParameter = {
      id: `${activeCategoryTab.toLowerCase()}_${Date.now()}`,
      category: activeCategoryTab,
      name: `Parameter Baru`,
      code: `PARAM_${Date.now()}`,
      weight: 10,
      description: 'Deskripsi kriteria evaluasi',
      dataSource: 'Database Laporan',
      criteria: {
        1: 'Kriteria Nilai 1 (Kurang)',
        2: 'Kriteria Nilai 2 (Cukup)',
        3: 'Kriteria Nilai 3 (Baik)',
        4: 'Kriteria Nilai 4 (Sangat Baik)',
      },
    };

    if (activeCategoryTab === 'Operator') {
      setOpParams((prev) => [...prev, newP]);
    } else {
      setNonParams((prev) => [...prev, newP]);
    }
  };

  const removeParameter = (id: string) => {
    if (currentParams.length <= 1) {
      alert('Minimal harus ada 1 parameter.');
      return;
    }
    if (activeCategoryTab === 'Operator') {
      setOpParams((prev) => prev.filter((p) => p.id !== id));
    } else {
      setNonParams((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSaveAll = () => {
    if (totalWeight !== 100) {
      if (
        !confirm(
          `Total bobot saat ini ${totalWeight}% (Bukan 100%). Sistem akan melakukan normalisasi otomatis. Lanjutkan?`
        )
      ) {
        return;
      }
    }

    updateOperatorParameters(opParams);
    updateNonomParameters(nonParams);
    updateMeritRules(mRules);
    updateDemeritRules(dRules);

    setToastMsg('Konfigurasi Parameter & Bobot MER Berhasil Diperbarui!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {toastMsg && (
        <div className="bg-emerald-600 text-white font-bold px-4 py-3 rounded-xl shadow-md flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Kustomisasi Parameter</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mengubah nilai dan ketentuan dari seluruh parameter MER
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Seluruh Parameter</span>
        </button>
      </div>

      {/* Category Tabs & Total Weight Indicator */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveCategoryTab('Operator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategoryTab === 'Operator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Parameter Operator Alat Berat
          </button>
          <button
            onClick={() => setActiveCategoryTab('Nonom')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategoryTab === 'Nonom'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Parameter Nonom (Non-Operator)
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-semibold">
            Total Persentase Bobot:
          </span>
          <span
            className={`text-sm font-black px-2.5 py-1 rounded-lg border ${
              totalWeight === 100
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {totalWeight}% {totalWeight === 100 ? '(Pas)' : '(Harus 100%)'}
          </span>
        </div>
      </div>

      {/* Parameter Cards Editor */}
      <div className="space-y-4">
        {currentParams.map((param, index) => (
          <div
            key={param.id}
            className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 flex-1">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  #{index + 1}
                </span>
                <input
                  type="text"
                  value={param.name}
                  onChange={(e) => handleNameChange(param.id, e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-600 flex-1 max-w-xs"
                />
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-slate-500 font-semibold">
                    Bobot (%):
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={param.weight}
                    onChange={(e) =>
                      handleWeightChange(param.id, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-center text-sm font-black text-blue-600 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  onClick={() => removeParameter(param.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Hapus Parameter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Auto-Scoring Threshold Rules Configuration */}
            {param.autoThreshold && (
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-blue-900 font-bold border-b border-blue-200 pb-1.5">
                  <span>⚙️ Standar Threshold Auto-Scoring System</span>
                  <span className="text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200 font-mono">
                    Tipe: {param.autoThreshold.metricType}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div>
                    <label className="text-emerald-700 font-bold block mb-0.5">Min Nilai 4:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={param.autoThreshold.minL4}
                      onChange={(e) =>
                        handleThresholdChange(
                          param.id,
                          'minL4',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-blue-700 font-bold block mb-0.5">Min Nilai 3:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={param.autoThreshold.minL3}
                      onChange={(e) =>
                        handleThresholdChange(
                          param.id,
                          'minL3',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-amber-700 font-bold block mb-0.5">Min Nilai 2:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={param.autoThreshold.minL2}
                      onChange={(e) =>
                        handleThresholdChange(
                          param.id,
                          'minL2',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Criteria Level 1 to 4 Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              {[1, 2, 3, 4].map((level) => (
                <div key={level} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      level === 4
                        ? 'text-emerald-600'
                        : level === 3
                        ? 'text-blue-600'
                        : level === 2
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    Kriteria Nilai {level}:
                  </span>
                  <textarea
                    rows={2}
                    value={param.criteria[level as 1 | 2 | 3 | 4] || ''}
                    onChange={(e) =>
                      handleCriterionChange(
                        param.id,
                        level as 1 | 2 | 3 | 4,
                        e.target.value
                      )
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addParameter}
          className="w-full bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 text-blue-600 font-semibold text-xs py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Parameter Baru ke {activeCategoryTab}</span>
        </button>
      </div>

      {/* Merit & Demerit Rules Editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
        {/* Merit Rules List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5" />
            <h4>Dynamic Merit Rules (Aturan Penambah Score)</h4>
          </div>

          <div className="space-y-2 text-xs">
            {mRules.map((rule, idx) => (
              <div
                key={rule.id}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={rule.label}
                    onChange={(e) => {
                      const updated = [...mRules];
                      updated[idx].label = e.target.value;
                      setMRules(updated);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none flex-1"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={rule.points}
                    onChange={(e) => {
                      const updated = [...mRules];
                      updated[idx].points = parseFloat(e.target.value) || 0;
                      setMRules(updated);
                    }}
                    className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 font-black text-emerald-600 text-center focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demerit Rules List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-rose-600 font-bold pb-2 border-b border-slate-100">
            <ShieldAlert className="w-5 h-5" />
            <h4>Dynamic Demerit Rules (Aturan Pengurang Score)</h4>
          </div>

          <div className="space-y-2 text-xs">
            {dRules.map((rule, idx) => (
              <div
                key={rule.id}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={rule.label}
                    onChange={(e) => {
                      const updated = [...dRules];
                      updated[idx].label = e.target.value;
                      setDRules(updated);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none flex-1"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={rule.points}
                    onChange={(e) => {
                      const updated = [...dRules];
                      updated[idx].points = parseFloat(e.target.value) || 0;
                      setDRules(updated);
                    }}
                    className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 font-black text-rose-600 text-center focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
