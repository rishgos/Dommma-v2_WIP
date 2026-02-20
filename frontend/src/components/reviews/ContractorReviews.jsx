import React, { useState, useEffect } from 'react';
import { Star, User, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContractorReviews = ({ contractorId, rating, reviewCount }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [contractorId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/contractors/${contractorId}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
    setLoading(false);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Rating distribution
  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating]++;
      }
    });
    return dist;
  };

  const distribution = getRatingDistribution();
  const maxCount = Math.max(...Object.values(distribution), 1);
  const visibleReviews = expanded ? reviews : reviews.slice(0, 3);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="h-16 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="contractor-reviews">
      {/* Summary Card */}
      <div className="bg-[#F5F5F0] rounded-xl p-5">
        <div className="flex items-center gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-[#1A2F3A]" data-testid="overall-rating">
              {rating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center gap-1 justify-center mt-1">
              {renderStars(rating || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{reviewCount || 0} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-gray-600">{star}</span>
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${(distribution[star] / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-gray-400 text-right">{distribution[star]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="mx-auto mb-2 text-gray-300" size={32} />
          <p className="text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-4 border border-gray-100"
              data-testid={`review-${review.id}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#1A2F3A] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {review.customer?.avatar ? (
                    <img
                      src={review.customer.avatar}
                      alt={review.customer.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    review.customer?.name?.charAt(0) || <User size={16} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[#1A2F3A] text-sm">
                      {review.customer?.name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(review.updated_at || review.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm text-gray-600 text-wrap">
                    {review.review}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Service: {review.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show More/Less */}
      {reviews.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-sm text-[#1A2F3A] hover:bg-[#F5F5F0] rounded-xl flex items-center justify-center gap-1"
          data-testid="toggle-reviews-btn"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} /> Show Less
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Show All {reviews.length} Reviews
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ContractorReviews;
