import React, { useState, useEffect } from 'react';
import {
  Shield, User, AlertTriangle, CheckCircle, Loader2,
  FileText, Clock, Search
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CreditCheck() {
  const { user } = useAuth();
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => { if (user) fetchReports(); }, [user]);

  useEffect(() => {
    if (tenantSearch.length < 2) { setTenants([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/users/search?q=${tenantSearch}&type=renter`);
        setTenants(res.data || []);
      } catch (e) { setTenants([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [tenantSearch]);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/credit-check/reports?landlord_id=${user.id}`);
      setReports(res.data);
    } catch (e) { console.error(e); }
  };

  const runCheck = async () => {
    if (!selectedTenant || !consent) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/credit-check/request`, {
        tenant_id: selectedTenant.id,
        full_name: selectedTenant.name,
        consent: true
      });
      setReport(res.data);
      fetchReports();
    } catch (e) { alert(e.response?.data?.detail || 'Credit check failed'); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  const scoreColor = (score) => score >= 720 ? 'text-green-600' : score >= 650 ? 'text-yellow-600' : 'text-red-600';
  const riskBg = (risk) => risk === 'low' ? 'bg-green-100 text-green-800' : risk === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="credit-check-page">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Tenant Credit Check</h1>
          <p className="text-gray-500 mt-1">Screen tenants with credit reports and rental history</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="credit-check-form">
            <h2 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2"><Search size={18} />Run Credit Check</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Search Tenant</label>
                <input type="text" value={tenantSearch} onChange={e => setTenantSearch(e.target.value)}
                  placeholder="Search by name or email..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" data-testid="tenant-search" />
                {tenants.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-xl bg-white shadow-lg max-h-40 overflow-y-auto">
                    {tenants.map(t => (
                      <button key={t.id} onClick={() => { setSelectedTenant(t); setTenantSearch(t.name); setTenants([]); }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
                        <span className="font-medium">{t.name}</span> <span className="text-gray-500">({t.email})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedTenant && (
                <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                  Selected: <strong>{selectedTenant.name}</strong> ({selectedTenant.email})
                </div>
              )}
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" data-testid="consent-checkbox" />
                <span className="text-xs text-gray-600">I confirm that I have obtained written consent from the tenant to perform this credit check in accordance with BC privacy regulations.</span>
              </label>
              <button onClick={runCheck} disabled={loading || !selectedTenant || !consent}
                className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="run-check-btn">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                Run Credit Check
              </button>
            </div>
          </div>

          {report ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="credit-report">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#1A2F3A] flex items-center gap-2"><FileText size={18} />Credit Report</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskBg(report.risk_level)}`}>{report.risk_level.toUpperCase()} RISK</span>
              </div>
              <div className="text-center py-4 mb-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">Credit Score</p>
                <p className={`text-5xl font-bold ${scoreColor(report.credit_score)}`}>{report.credit_score}</p>
                <p className="text-xs text-gray-400 mt-1">Range: {report.score_range}</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-[#1A2F3A]">Credit Factors</h3>
                {Object.entries(report.factors).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-600">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <h3 className="font-medium text-sm text-[#1A2F3A]">Rental History</h3>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-600">Evictions</span>
                  <span className={`font-medium ${report.rental_history.evictions === 0 ? 'text-green-600' : 'text-red-600'}`}>{report.rental_history.evictions}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-600">Late Payments (12mo)</span>
                  <span className="font-medium">{report.rental_history.late_payments_12mo}</span>
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-xl text-center ${report.recommendation === 'Approve' ? 'bg-green-50 border border-green-200' : report.recommendation === 'Review' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="font-semibold">{report.recommendation === 'Approve' ? <CheckCircle size={20} className="inline text-green-600 mr-1" /> : <AlertTriangle size={20} className="inline text-yellow-600 mr-1" />}{report.recommendation}</p>
              </div>
              <p className="text-xs text-gray-400 mt-3 italic">{report.disclaimer}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2"><Clock size={18} />Recent Reports</h2>
              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map(r => (
                    <button key={r.id} onClick={() => setReport(r)} className="w-full p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100" data-testid={`report-${r.id}`}>
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium text-sm">{r.tenant_name}</p><p className="text-xs text-gray-500">{new Date(r.requested_at).toLocaleDateString()}</p></div>
                        <div className="text-right">
                          <p className={`font-bold ${scoreColor(r.credit_score)}`}>{r.credit_score}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${riskBg(r.risk_level)}`}>{r.risk_level}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Shield size={40} className="mx-auto mb-3 text-gray-300" />
                  <p>No credit reports yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
