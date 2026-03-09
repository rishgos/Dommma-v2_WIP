import React, { useState, useEffect } from 'react';
import { Star, User, Clock, ChevronDown } from 'lucide-react';
import StarRating, { RatingDisplay, RatingForm } from './StarRating';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * UserRatingCard - Displays a user's rating summary and reviews
 */
export default function UserRatingCard({ 
  userId, 
  showReviews = true,
  showForm = false,
  currentUserId = null,
  contextType = 'general',
  contextId = null,
  onRatingSubmitted = null
}) {
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [userId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const [ratingsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/api/ratings/user/${userId}`),
        axios.get(`${API}/api/ratings/summary/${userId}`)
      ]);
      
      setRatingData({
        ...ratingsRes.data,
        distribution: summaryRes.data.distribution
      });
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setRatingData({
        user_id: userId,
        average_rating: 0,
        total_ratings: 0,
        reviews: [],
        distribution: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async ({ rating, review }) => {
    if (!currentUserId) {
      setError('You must be logged in to submit a rating');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await axios.post(`${API}/api/ratings/user?rater_id=${currentUserId}`, {
        rated_user_id: userId,
        rating,
        review: review || null,
        context_type: contextType,
        context_id: contextId
      });
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      
      // Refresh ratings
      await fetchRatings();
      
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  const reviews = ratingData?.reviews || [];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" data-testid="user-rating-card">
      {/* Rating Summary */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
          <Star className="text-yellow-400" size={20} />
          Ratings & Reviews
        </h3>
        
        <RatingDisplay
          averageRating={ratingData?.average_rating || 0}
          totalRatings={ratingData?.total_ratings || 0}
          distribution={ratingData?.distribution || {}}
          showDistribution={reviews.length > 0}
        />
      </div>

      {/* Rating Form */}
      {showForm && currentUserId && currentUserId !== userId && (
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          {submitSuccess ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="text-green-600" size={24} />
              </div>
              <p className="font-medium text-green-700">Thank you for your rating!</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <RatingForm
                onSubmit={handleSubmitRating}
                loading={submitting}
                ratedUserName={ratingData?.user_name || 'this user'}
              />
            </>
          )}
        </div>
      )}

      {/* Reviews List */}
      {showReviews && reviews.length > 0 && (
        <div className="p-6">
          <h4 className="font-medium text-[#1A2F3A] mb-4">Recent Reviews</h4>
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
          
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="mt-4 w-full py-2 text-[#1A2F3A] text-sm font-medium hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
              <ChevronDown className={`transition-transform ${showAllReviews ? 'rotate-180' : ''}`} size={16} />
            </button>
          )}
        </div>
      )}

      {showReviews && reviews.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <p>No reviews yet</p>
        </div>
      )}
    </div>
  );
}

/**
 * ReviewItem - Single review display
 */
function ReviewItem({ review }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0" data-testid={`review-${review.id}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#1A2F3A] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
          {review.rater_name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-medium text-[#1A2F3A] truncate">{review.rater_name}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <StarRating value={review.rating} size={14} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Clock size={12} />
            <span>{formatDate(review.created_at)}</span>
            {review.context_type && review.context_type !== 'general' && (
              <>
                <span>•</span>
                <span className="capitalize">{review.context_type.replace('_', ' ')}</span>
              </>
            )}
          </div>
          {review.review && (
            <p className="text-sm text-gray-600">{review.review}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact rating display for cards/lists
 */
export function CompactRating({ rating, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={size} className="fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium text-[#1A2F3A]">
        {rating > 0 ? rating.toFixed(1) : '0.0'}
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </div>
  );
}
