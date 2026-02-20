import React, { useState, useEffect } from 'react';
import { Trophy, Star, Shield, Medal, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContractorLeaderboard = ({ limit = 5, showHeader = true, compact = false }) => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/contractors/leaderboard?limit=${limit}`);
      setContractors(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
    setLoading(false);
  };

  const getMedalColor = (index) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-yellow-600'; // Gold
      case 1: return 'from-gray-300 to-gray-500';     // Silver
      case 2: return 'from-amber-600 to-amber-800';   // Bronze
      default: return 'from-[#1A2F3A] to-[#2C4A52]';
    }
  };

  const getMedalIcon = (index) => {
    if (index < 3) {
      return (
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center text-white shadow-md`}>
          {index === 0 ? <Trophy size={14} /> : <Medal size={14} />}
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm">
        {index + 1}
      </div>
    );
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  if (loading) {
    return (
      <div className={`${compact ? '' : 'bg-white rounded-2xl p-6'} animate-pulse`}>
        {showHeader && <div className="h-6 bg-gray-200 rounded w-40 mb-4" />}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'bg-white rounded-2xl p-6'} data-testid="contractor-leaderboard">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <h3 className="font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Top Contractors
            </h3>
          </div>
          <Link
            to="/services"
            className="text-sm text-[#1A2F3A] hover:underline flex items-center gap-1"
            data-testid="view-all-contractors"
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {contractors.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Trophy className="mx-auto mb-2 text-gray-300" size={32} />
          <p className="text-sm">No contractors ranked yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contractors.map((contractor, index) => (
            <Link
              key={contractor.id}
              to={`/services?contractor=${contractor.user_id}`}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[#F5F5F0] ${
                index === 0 ? 'bg-yellow-50' : ''
              }`}
              data-testid={`leaderboard-item-${index}`}
            >
              {/* Rank Medal */}
              {getMedalIcon(index)}

              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-[#1A2F3A] flex items-center justify-center text-white text-lg font-semibold flex-shrink-0"
                   style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {contractor.avatar ? (
                  <img
                    src={contractor.avatar}
                    alt={contractor.business_name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  contractor.business_name?.charAt(0)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#1A2F3A] truncate">
                    {contractor.business_name}
                  </span>
                  {contractor.verified && (
                    <Shield className="text-green-500 flex-shrink-0" size={12} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {renderStars(contractor.rating)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {contractor.rating?.toFixed(1)} ({contractor.review_count || 0})
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-[#1A2F3A]">
                  {contractor.completed_jobs || 0}
                </p>
                <p className="text-xs text-gray-500">jobs</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractorLeaderboard;
