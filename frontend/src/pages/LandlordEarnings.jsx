import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Home, BarChart3, Loader2,
  Building2, Users, AlertCircle, PieChart, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandlordEarnings() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);

  useEffect(() => {
    if (user) fetchEarnings();
  }, [user, months]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/landlord/earnings?landlord_id=${user.id}&months=${months}`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="landlord-earnings-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Earnings Dashboard</h1>
            <p className="text-gray-500 mt-1">Track income, vacancy rates, and ROI</p>
          </div>
          <select value={months} onChange={e => setMonths(parseInt(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="months-select">
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#1A2F3A]" /></div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="summary-cards">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2"><DollarSign size={18} className="text-green-600" /><span className="text-xs text-gray-500">Net Income</span></div>
                <p className="text-2xl font-bold text-green-700">${data.summary.net_income.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">After ${data.summary.total_platform_fees.toLocaleString()} fees</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-blue-600" /><span className="text-xs text-gray-500">Avg Monthly</span></div>
                <p className="text-2xl font-bold text-blue-700">${data.summary.avg_monthly_income.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Projected: ${data.summary.projected_annual.toLocaleString()}/yr</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2"><Building2 size={18} className="text-purple-600" /><span className="text-xs text-gray-500">Vacancy</span></div>
                <p className={`text-2xl font-bold ${data.properties.vacancy_rate > 10 ? 'text-red-600' : 'text-green-600'}`}>{data.properties.vacancy_rate}%</p>
                <p className="text-xs text-gray-400 mt-1">{data.properties.vacant} of {data.properties.total} vacant</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2"><PieChart size={18} className="text-orange-600" /><span className="text-xs text-gray-500">Collection Rate</span></div>
                <p className={`text-2xl font-bold ${data.performance.collection_rate >= 90 ? 'text-green-600' : 'text-orange-600'}`}>{data.performance.collection_rate}%</p>
                <p className="text-xs text-gray-400 mt-1">ROI: {data.performance.roi_percentage}%</p>
              </div>
            </div>

            {data.summary.total_pending > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3" data-testid="pending-alert">
                <AlertCircle size={20} className="text-yellow-600" />
                <p className="text-sm text-yellow-800"><strong>${data.summary.total_pending.toLocaleString()}</strong> in pending/overdue payments</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="monthly-chart">
              <h3 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2"><BarChart3 size={18} />Monthly Income</h3>
              <div className="space-y-2">
                {data.monthly_breakdown.map((m, i) => {
                  const maxVal = Math.max(...data.monthly_breakdown.map(x => x.collected || 1));
                  return (
                    <div key={i} className="flex items-center gap-3" data-testid={`month-${m.month}`}>
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{m.label}</span>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="h-6 bg-green-500 rounded-r" style={{ width: `${Math.max(2, (m.collected / maxVal) * 100)}%` }} title={`Collected: $${m.collected}`} />
                        {m.pending > 0 && <div className="h-6 bg-yellow-400 rounded-r" style={{ width: `${(m.pending / maxVal) * 100}%` }} title={`Pending: $${m.pending}`} />}
                        {m.overdue > 0 && <div className="h-6 bg-red-400 rounded-r" style={{ width: `${(m.overdue / maxVal) * 100}%` }} title={`Overdue: $${m.overdue}`} />}
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-20 text-right">${m.net_income.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" />Collected</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded" />Pending</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded" />Overdue</span>
              </div>
            </div>

            {data.top_properties.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="top-properties">
                <h3 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2"><Home size={18} />Properties</h3>
                <div className="space-y-3">
                  {data.top_properties.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm text-[#1A2F3A]">{p.title}</p>
                        <p className="text-xs text-gray-500">{p.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#1A2F3A]">${p.rent?.toLocaleString()}{p.type === 'rent' ? '/mo' : ''}</p>
                        <p className="text-xs text-gray-400">{p.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No earnings data available yet</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
