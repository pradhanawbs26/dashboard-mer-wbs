import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyReport, RawMetricsData } from '../../types';
import { calculateMerScore, formatPeriodLabel, evaluateParameterScore } from '../../utils/calculations';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  FileCheck,
  Save,
  Zap,
  HelpCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const BulkImporter: React.FC = () => {
  const {
    currentUser,
    employees,
    selectedPeriod,
    operatorParameters,
    nonomParameters,
    meritRules,
    demeritRules,
    bulkImportReports,
  } = useApp();

  const subEmployees = employees.filter((e) => e.role === 'subordinate');

  const [parsedRows, setParsedRows] = useState<
    {
      nik: string;
      name: string;
      category: string;
      rawMetrics: RawMetricsData;
      scores: Record<string, number>;
      scoreDetails: { paramName: string; level: number; reason: string }[];
      meritCode?: string;
      demeritCode?: string;
      isValid: boolean;
      errorMessage?: string;
      calcScore: number;
    }[]
  >([]);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Download Standardized Excel Template containing supporting indicator metrics columns
  const downloadTemplate = () => {
    const templateData = subEmployees.map((emp) => {
      const isOp = emp.category === 'Operator';

      if (isOp) {
        return {
          NIK: emp.nik,
          Nama_Karyawan: emp.name,
          Kategori: emp.category,
          Area_Kerja: emp.department || 'CY',
          'ATR_Rate (%)': 98.0,
          Terlambat_Kali: 0,
          Mangkir_Kali: 0,
          'Productivity_Rate (%)': 105.0,
          SAP_Laporan_Count: 4,
          Insiden_Count: 0,
          Misoperasi_Count: 0,
          MTO_Count: 0,
          Timesheet_Status: 'Lengkap & Valid',
          Merit_Code: '',
          Demerit_Code: '',
          Catatan: 'Data indikator operasional bulan ini',
        };
      } else {
        return {
          NIK: emp.nik,
          Nama_Karyawan: emp.name,
          Kategori: emp.category,
          Area_Kerja: emp.department || 'CY',
          'ATR_Rate (%)': 98.0,
          Terlambat_Kali: 0,
          Mangkir_Kali: 0,
          SAP_Laporan_Count: 4,
          Insiden_Count: 0,
          Timesheet_Status: 'Lengkap & Valid',
          Sikap_Kerja_Poin: 90,
          Merit_Code: '',
          Demerit_Code: '',
          Catatan: 'Data indikator operasional bulan ini',
        };
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Auto-fit column widths
    ws['!cols'] = [
      { wch: 12 }, // NIK
      { wch: 25 }, // Nama
      { wch: 12 }, // Kategori
      { wch: 15 }, // Departemen
      { wch: 15 }, // ATR_Rate
      { wch: 15 }, // Terlambat
      { wch: 15 }, // Mangkir
      { wch: 22 }, // Productivity
      { wch: 20 }, // SAP
      { wch: 15 }, // Insiden
      { wch: 18 }, // Misoperasi
      { wch: 12 }, // MTO
      { wch: 22 }, // Timesheet
      { wch: 15 }, // Merit
      { wch: 15 }, // Demerit
      { wch: 30 }, // Catatan
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template_Indikator_MER');
    XLSX.writeFile(wb, `Template_Indikator_MER_${selectedPeriod}.xlsx`);
  };

  // Upload & Parse Excel / CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const processed = data.map((row) => {
          const nik = String(row['NIK'] || '').trim();
          const emp = employees.find(
            (e) => e.nik.trim().toLowerCase() === nik.toLowerCase()
          ) || subEmployees.find(
            (e) => e.nik.trim().toLowerCase() === nik.toLowerCase()
          );

          if (!emp) {
            return {
              nik,
              name: row['Nama_Karyawan'] || 'Unknown',
              category: row['Kategori'] || 'Operator',
              rawMetrics: {},
              scores: {},
              scoreDetails: [],
              isValid: false,
              errorMessage: `NIK '${nik}' tidak ditemukan di Master Data`,
              calcScore: 0,
            };
          }

          const isOp = emp.category === 'Operator';
          const params = isOp ? operatorParameters : nonomParameters;

          // Extract raw supporting indicators from Excel row columns
          const rawAtr = parseFloat(
            String(
              row['ATR_Rate (%)'] ??
                row['ATR_Rate'] ??
                row['ATR'] ??
                row['ATR (%)'] ??
                '98'
            ).replace('%', '')
          );
          const rawLate = parseInt(
            String(
              row['Terlambat_Kali'] ?? row['Terlambat'] ?? row['Terlambat (Kali)'] ?? '0'
            ),
            10
          );
          const rawMangkir = parseInt(
            String(
              row['Mangkir_Kali'] ?? row['Mangkir'] ?? row['Mangkir (Kali)'] ?? '0'
            ),
            10
          );
          const rawProd = parseFloat(
            String(
              row['Productivity_Rate (%)'] ??
                row['Productivity_Rate'] ??
                row['Productivity'] ??
                row['Produktivitas'] ??
                row['Produktivitas (%)'] ??
                '105'
            ).replace('%', '')
          );
          const rawSap = parseInt(
            String(
              row['SAP_Laporan_Count'] ??
                row['SAP_Count'] ??
                row['SAP'] ??
                row['SAP (Laporan)'] ??
                '4'
            ),
            10
          );
          const rawInc = parseInt(
            String(
              row['Insiden_Count'] ?? row['Incident_Count'] ?? row['Insiden'] ?? '0'
            ),
            10
          );
          const rawMis = parseInt(
            String(
              row['Misoperasi_Count'] ??
                row['Misoperasi'] ??
                row['Misoperasi (Kali)'] ??
                '0'
            ),
            10
          );
          const rawMto = parseInt(
            String(row['MTO_Count'] ?? row['MTO'] ?? '0'),
            10
          );
          const rawTs = String(
            row['Timesheet_Status'] ??
              row['Timesheet'] ??
              row['Status_Timesheet'] ??
              'Lengkap & Valid'
          ).trim();
          const rawGeneric = parseFloat(
            String(
              row['Sikap_Kerja_Poin'] ??
                row['Poin_Sikap'] ??
                row['Generic_Value'] ??
                '90'
            )
          );

          const rawMetricsObj: RawMetricsData = {
            atrRate: isNaN(rawAtr) ? 98 : rawAtr,
            terlambatCount: isNaN(rawLate) ? 0 : rawLate,
            mangkirCount: isNaN(rawMangkir) ? 0 : rawMangkir,
            productivityRate: isNaN(rawProd) ? 105 : rawProd,
            sapCount: isNaN(rawSap) ? 4 : rawSap,
            incidentCount: isNaN(rawInc) ? 0 : rawInc,
            misoperasiCount: isNaN(rawMis) ? 0 : rawMis,
            mtoCount: isNaN(rawMto) ? 0 : rawMto,
            timesheetStatus: rawTs,
            genericValue: isNaN(rawGeneric) ? 90 : rawGeneric,
          };

          // Evaluate each parameter score automatically using threshold rules
          const scores: Record<string, number> = {};
          const scoreDetails: { paramName: string; level: number; reason: string }[] = [];

          params.forEach((p) => {
            const evalRes = evaluateParameterScore(p, rawMetricsObj);
            scores[p.id] = evalRes.level;
            scoreDetails.push({
              paramName: p.name,
              level: evalRes.level,
              reason: evalRes.reason,
            });
          });

          // Merit / Demerit match
          const meritCode = row['Merit_Code']
            ? String(row['Merit_Code']).trim()
            : undefined;
          const demeritCode = row['Demerit_Code']
            ? String(row['Demerit_Code']).trim()
            : undefined;

          const selectedMeritIds: string[] = [];
          const selectedDemeritIds: string[] = [];

          if (meritCode) {
            const foundM = meritRules.find(
              (m) => m.code === meritCode || m.id === meritCode
            );
            if (foundM) selectedMeritIds.push(foundM.id);
          }

          if (demeritCode) {
            const foundD = demeritRules.find(
              (d) => d.code === demeritCode || d.id === demeritCode
            );
            if (foundD) selectedDemeritIds.push(foundD.id);
          }

          const calc = calculateMerScore(
            scores,
            params,
            selectedMeritIds,
            selectedDemeritIds,
            meritRules,
            demeritRules
          );

          return {
            nik,
            name: emp.name,
            category: emp.category,
            rawMetrics: rawMetricsObj,
            scores,
            scoreDetails,
            meritCode,
            demeritCode,
            isValid: true,
            calcScore: calc.finalScore,
          };
        });

        setParsedRows(processed);
        setIsSuccess(false);
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format file sesuai template data indikator.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Commit valid imported reports to App Context
  const handleBatchCommit = async () => {
    const validItems = parsedRows.filter((r) => r.isValid);
    if (validItems.length === 0) return;

    setIsSaving(true);
    try {
      const newReports: MonthlyReport[] = validItems.map((item) => {
        const emp =
          employees.find((e) => e.nik.trim().toLowerCase() === item.nik.trim().toLowerCase()) ||
          subEmployees.find((e) => e.nik.trim().toLowerCase() === item.nik.trim().toLowerCase())!;

        const isOp = emp.category === 'Operator';
        const params = isOp ? operatorParameters : nonomParameters;

        const selectedMeritIds: string[] = [];
        const selectedDemeritIds: string[] = [];

        if (item.meritCode) {
          const foundM = meritRules.find(
            (m) => m.code === item.meritCode || m.id === item.meritCode
          );
          if (foundM) selectedMeritIds.push(foundM.id);
        }

        if (item.demeritCode) {
          const foundD = demeritRules.find(
            (d) => d.code === item.demeritCode || d.id === item.demeritCode
          );
          if (foundD) selectedDemeritIds.push(foundD.id);
        }

        const calc = calculateMerScore(
          item.scores,
          params,
          selectedMeritIds,
          selectedDemeritIds,
          meritRules,
          demeritRules
        );

        const formattedRawMetrics: Record<string, string> = {
          'ATR Kehadiran': `${item.rawMetrics.atrRate || 0}%`,
          'Terlambat / Mangkir': `${item.rawMetrics.terlambatCount || 0}x Terlambat / ${item.rawMetrics.mangkirCount || 0}x Mangkir`,
          'Productivity': `${item.rawMetrics.productivityRate || 0}%`,
          'SAP Hazard Report': `${item.rawMetrics.sapCount || 0} Laporan`,
          'Insiden K3': `${item.rawMetrics.incidentCount || 0} Incident`,
          'Misoperasi': `${item.rawMetrics.misoperasiCount || 0} Incident`,
          'Timesheet Status': item.rawMetrics.timesheetStatus || 'Lengkap & Valid',
        };

        return {
          id: `rep_${emp.nik}_${selectedPeriod}`,
          nik: emp.nik,
          employeeName: emp.name,
          department: emp.department,
          category: emp.category,
          equipmentType: emp.equipmentType,
          period: selectedPeriod,
          scores: item.scores,
          rawMetrics: formattedRawMetrics,
          meritItems: selectedMeritIds,
          demeritItems: selectedDemeritIds,
          baseScore: calc.baseScore,
          meritPoint: calc.meritPoint,
          demeritPoint: calc.demeritPoint,
          finalScore: calc.finalScore,
          evaluatorNik: currentUser?.nik || 'admin',
          evaluatorName: currentUser?.name || 'Administrator',
          notes: `Bulk Import Excel Indikator Auto-Evaluasi (${new Date().toLocaleDateString('id-ID')})`,
          updatedAt: new Date().toISOString(),
        };
      });

      await bulkImportReports(newReports);
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to commit reports in bulk:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Bulk Data Importer Indikator (Auto Evaluasi MER)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin mengunggah data indikator riil (ATR, Terlambat, Productivity, SAP, Misoperasi, Timesheet). Sistem akan menilai otomatis 1-4.
          </p>
        </div>

        <button
          onClick={downloadTemplate}
          className="bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Template Indikator Excel</span>
        </button>
      </div>

      {/* Excel Structure Info Box */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-blue-800">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Panduan Kolom File Excel Indikator Operasional:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-blue-950">
          <div className="bg-white/80 p-2 rounded border border-blue-100">
            <p className="font-bold text-blue-700">📌 Disiplin & Kehadiran</p>
            <p><span className="font-semibold">ATR_Rate (%):</span> Persentase Kehadiran (98%)</p>
            <p><span className="font-semibold">Terlambat_Kali / Mangkir_Kali:</span> Jumlah frekuensi</p>
          </div>
          <div className="bg-white/80 p-2 rounded border border-blue-100">
            <p className="font-bold text-blue-700">📊 Productivity & Safety</p>
            <p><span className="font-semibold">Productivity_Rate (%):</span> Target achievement (105%)</p>
            <p><span className="font-semibold">SAP_Laporan_Count / Insiden:</span> Laporan hazard & K3</p>
          </div>
          <div className="bg-white/80 p-2 rounded border border-blue-100">
            <p className="font-bold text-blue-700">⚙️ Kepatuhan Operasional</p>
            <p><span className="font-semibold">Misoperasi_Count / MTO:</span> Kejadian misoperasi</p>
            <p><span className="font-semibold">Timesheet_Status:</span> Status pengumpulan laporan</p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center text-slate-800 transition-all space-y-3 shadow-sm">
        <Upload className="w-10 h-10 text-blue-600 mx-auto" />
        <div>
          <h4 className="font-bold text-base text-slate-900">
            Pilih atau Drag File Excel Indikator (.xlsx / .csv)
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Unggah file berisi nilai indikator. Sistem akan mengevaluasi threshold kriteria secara otomatis.
          </p>
        </div>

        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          className="hidden"
          id="excel-file-upload"
        />
        <label
          htmlFor="excel-file-upload"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-sm"
        >
          Pilih File dari Komputer
        </label>
      </div>

      {/* Success Banner */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl font-bold text-xs flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Proses Bulk Import Indikator Berhasil! Data penilaian MER untuk periode{' '}
            {formatPeriodLabel(selectedPeriod)} telah otomatis dikalkulasi dan disimpan.
          </span>
        </div>
      )}

      {/* Upload Preview Grid with Auto Evaluation breakdown */}
      {parsedRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>
                Hasil Auto-Evaluasi Sistem dari Data Indikator ({parsedRows.length} Karyawan)
              </span>
            </h4>

            <button
              onClick={handleBatchCommit}
              disabled={isSaving || parsedRows.filter((r) => r.isValid).length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center space-x-1 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Menyimpan ke Cloud...'
                  : `Simpan Massal (${parsedRows.filter((r) => r.isValid).length} Valid)`}
              </span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Status</th>
                  <th className="p-3">NIK & Nama</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Data Indikator Diinput</th>
                  <th className="p-3">Hasil Evaluasi Parameter (1-4)</th>
                  <th className="p-3 text-center">Skor MER Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3">
                      {row.isValid ? (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded flex items-center space-x-1 w-max">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>AUTO EVAL</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                          ERROR
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{row.name}</p>
                      <span className="text-[10px] text-blue-600 font-mono">
                        {row.nik}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {row.category}
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 space-y-0.5">
                      {row.isValid ? (
                        <div>
                          <p><span className="font-semibold">ATR:</span> {row.rawMetrics.atrRate}% (Terlambat {row.rawMetrics.terlambatCount}x)</p>
                          <p><span className="font-semibold">Prod:</span> {row.rawMetrics.productivityRate}% | <span className="font-semibold">SAP:</span> {row.rawMetrics.sapCount}</p>
                          <p><span className="font-semibold">Misoperasi:</span> {row.rawMetrics.misoperasiCount}x | <span className="font-semibold">TS:</span> {row.rawMetrics.timesheetStatus}</p>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-bold">{row.errorMessage}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {row.isValid ? (
                        <div className="flex flex-wrap gap-1">
                          {row.scoreDetails.map((det, dIdx) => (
                            <span
                              key={dIdx}
                              title={`${det.paramName}: ${det.reason}`}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                det.level === 4
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : det.level === 3
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : det.level === 2
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {det.paramName}: L{det.level}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-black text-blue-600 text-sm">
                      {row.isValid ? row.calcScore.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
