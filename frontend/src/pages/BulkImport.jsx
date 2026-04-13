import React, { useState } from 'react';
import { Upload, FileText, Download, Check, AlertCircle, Loader2, ArrowLeft, Table, X } from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const TEMPLATE_CSV = `title,address,city,province,postal_code,price,bedrooms,bathrooms,sqft,property_type,description,pet_friendly,parking,listing_type,amenities,available_date
Modern Downtown Condo,123 Main St Unit 405,Vancouver,BC,V6B 1A1,2500,2,1,850,Condo,Bright 2BR condo with mountain views,yes,yes,rent,"Gym, Pool, Concierge",2026-05-01
Cozy Kitsilano Studio,456 Vine St,Vancouver,BC,V6H 3J8,1600,0,1,450,Studio,Charming studio near the beach,no,no,rent,"Laundry, Bike Storage",2026-06-01`;

export default function BulkImport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dommma-listing-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.toLowerCase().split('.').pop();
    if (!['csv', 'tsv', 'json'].includes(ext)) {
      setError('Please upload a CSV, TSV, or JSON file');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);

    // Preview first few rows
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (ext === 'csv' || ext === 'tsv') {
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(ext === 'tsv' ? '\t' : ',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1, 6).map(line => {
          const vals = line.split(ext === 'tsv' ? '\t' : ',').map(v => v.trim().replace(/"/g, ''));
          const obj = {};
          headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
          return obj;
        });
        setPreview({ headers, rows, total: lines.length - 1 });
      } else if (ext === 'json') {
        try {
          const data = JSON.parse(text);
          const arr = Array.isArray(data) ? data : data.listings || data.data || [data];
          setPreview({ headers: Object.keys(arr[0] || {}), rows: arr.slice(0, 5), total: arr.length });
        } catch { setError('Invalid JSON format'); }
      }
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(
        `${API}/api/admin/bulk-import?admin_key=pray1234&landlord_id=${user.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please check your file format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/my-properties')} className="flex items-center gap-2 text-gray-500 hover:text-[#1A2F3A] dark:hover:text-white mb-2 text-sm">
            <ArrowLeft size={16} /> Back to My Properties
          </button>
          <h1 className="text-3xl font-semibold text-[#1A2F3A] dark:text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Bulk Import Listings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Upload multiple properties at once from a spreadsheet</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-[#1A2F3A] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <Download size={16} />
          Download Template
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">How it works</h3>
        <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal pl-5">
          <li><strong>Download the template</strong> CSV file above (or use your own spreadsheet)</li>
          <li><strong>Fill in your properties</strong> — one row per listing</li>
          <li><strong>Upload the file</strong> — we auto-detect column names (no exact format needed)</li>
          <li><strong>Review and confirm</strong> — preview before creating listings</li>
        </ol>
        <p className="text-xs text-blue-600 dark:text-blue-500 mt-3">Supports CSV, TSV, and JSON files. Column headers are auto-mapped — your spreadsheet doesn't need exact header names.</p>
      </div>

      {/* Upload Area */}
      {!result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-[#1A2F3A] bg-[#1A2F3A]/5' :
            file ? 'border-green-400 bg-green-50 dark:bg-green-900/10' :
            'border-gray-300 dark:border-white/20 hover:border-[#1A2F3A]'
          }`}
          onClick={() => !file && document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.tsv,.json"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={24} className="text-green-600" />
              <div className="text-left">
                <p className="font-medium text-[#1A2F3A] dark:text-white">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload size={36} className="mx-auto mb-3 text-gray-400" />
              <p className="font-medium text-[#1A2F3A] dark:text-white">Drop your spreadsheet here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse (CSV, TSV, JSON)</p>
            </>
          )}
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <div className="bg-white dark:bg-[#1A2332] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A2F3A] dark:text-white flex items-center gap-2">
              <Table size={18} /> Preview ({preview.total} listings found)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {preview.headers.slice(0, 8).map(h => (
                    <th key={h} className="text-left py-2 px-3 bg-[#F5F5F0] dark:bg-white/5 font-semibold text-[#1A2F3A] dark:text-white border-b">{h}</th>
                  ))}
                  {preview.headers.length > 8 && <th className="py-2 px-3 bg-[#F5F5F0] dark:bg-white/5 text-gray-400">+{preview.headers.length - 8} more</th>}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    {preview.headers.slice(0, 8).map(h => (
                      <td key={h} className="py-2 px-3 border-b border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{row[h] || '-'}</td>
                    ))}
                    {preview.headers.length > 8 && <td className="py-2 px-3 text-gray-400">...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50"
            >
              {uploading ? <><Loader2 size={18} className="animate-spin" /> Importing...</> : <><Upload size={18} /> Import {preview.total} Listings</>}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-3">
              <Check size={24} className="text-green-600" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Import Complete!</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-white dark:bg-white/5 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-[#1A2F3A] dark:text-white">{result.total_rows}</p>
                <p className="text-xs text-gray-500">Total Rows</p>
              </div>
              <div className="bg-white dark:bg-white/5 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-gray-500">Created</p>
              </div>
              <div className="bg-white dark:bg-white/5 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                <p className="text-xs text-gray-500">Errors</p>
              </div>
            </div>
          </div>

          {/* Column mapping used */}
          {result.column_mapping && Object.keys(result.column_mapping).length > 0 && (
            <div className="bg-white dark:bg-[#1A2332] rounded-2xl p-5 shadow-sm">
              <h4 className="font-semibold text-[#1A2F3A] dark:text-white mb-3">Column Mapping (Auto-Detected)</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.column_mapping).map(([from, to]) => (
                  <span key={from} className="text-xs px-3 py-1.5 bg-[#F5F5F0] dark:bg-white/5 rounded-full text-gray-600 dark:text-gray-400">
                    "{from}" → <strong className="text-[#1A2F3A] dark:text-white">{to}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Errors detail */}
          {result.error_details?.length > 0 && (
            <div className="bg-white dark:bg-[#1A2332] rounded-2xl p-5 shadow-sm">
              <h4 className="font-semibold text-red-600 mb-3">Errors</h4>
              {result.error_details.map((err, i) => (
                <p key={i} className="text-sm text-red-500 mb-1">Row {err.row}: {err.error}</p>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate('/my-properties')} className="px-6 py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52]">
              View My Properties
            </button>
            <button onClick={() => { setResult(null); setFile(null); setPreview(null); }} className="px-6 py-3 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-[#1A2F3A] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5">
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
