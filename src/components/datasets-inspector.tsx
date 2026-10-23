import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Database,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { rawCoreHrCSV, rawPayrollCSV, rawLearningCSV, rawAccessDirectoryCSV } from '../../lib/csv-loader';

export const DatasetsInspector: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<'core_hr' | 'payroll' | 'learning' | 'access'>('core_hr');

  const datasets = {
    core_hr: {
      name: 'core_hr.csv',
      system: 'Oracle HCM Cloud Master',
      raw: rawCoreHrCSV,
      desc: 'Master employee profiles, employment status, business units, job titles, and cost centers.',
    },
    payroll: {
      name: 'payroll.csv',
      system: 'SAP S/4HANA Payroll & WPS',
      raw: rawPayrollCSV,
      desc: 'Compensation records, salary currency, allowances, IBANs, and cost center ledger codes.',
    },
    learning: {
      name: 'learning.csv',
      system: 'Emirates Aviation College LMS',
      raw: rawLearningCSV,
      desc: 'Flight crew type ratings, recurrent simulator checks (LPC), and dangerous goods certifications.',
    },
    access: {
      name: 'access_directory.csv',
      system: 'Dubai Pass Office & Entra ID',
      raw: rawAccessDirectoryCSV,
      desc: 'Physical airport RFID badge status, restricted airside clearances, and Active Directory security tiers.',
    },
  };

  const active = datasets[selectedDataset];

  const lines = active.raw.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((l) => {
    // Basic CSV splitting handling quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(l)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      let val = match[1];
      if (val !== undefined && val !== '') {
        val = val.replace(/^"|"$/g, '').trim();
        matches.push(val);
      }
    }
    return matches.length > 0 ? matches : l.split(',');
  });

  const downloadActiveCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(active.raw);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', active.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Enterprise Synthetic Data Packs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Underlying master records simulated across 4 enterprise Emirates Group applications
          </p>
        </div>

        <button
          onClick={downloadActiveCSV}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap self-start"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          Download {active.name}
        </button>
      </div>

      {/* Dataset Picker Tabs */}
      <div className="flex flex-wrap gap-2 text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800">
        {(Object.keys(datasets) as Array<keyof typeof datasets>).map((key) => {
          const item = datasets[key];
          return (
            <button
              key={key}
              onClick={() => setSelectedDataset(key)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2 ${
                selectedDataset === key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>{item.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">({item.system})</span>
            </button>
          );
        })}
      </div>

      <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
        <strong className="text-slate-200 font-medium">Dataset Scope:</strong> {active.desc}
      </div>

      {/* Table Viewer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800 sticky top-0 z-10">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-850/50 transition-colors font-mono">
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="py-2.5 px-4 text-slate-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
