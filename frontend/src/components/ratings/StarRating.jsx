import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating component - displays and/or allows selecting star ratings
 * @param {number} value - Current rating value (0-5)
 * @param {function} onChange - Callback when rating changes (if editable)
 * @param {number} size - Size of stars in pixels (default: 20)
 * @param {boolean} editable - Whether the rating can be changed (default: false)
 * @param {boolean} showValue - Whether to show the numeric value (default: false)
 * @param {number} totalRatings - Total number of ratings to display
 */
export default function StarRating({ 
  value = 0, 
  onChange, 
  size = 20, 
  editable = false, 
  showValue = false,
  totalRatings = null,
  className = ''
}) {
  const [hoverValue, setHoverValue] = useState(0);
  
  const displayValue = hoverValue || value;
  
  const handleClick = (rating) => {
    if (editable && onChange) {
      onChange(rating);
    }
  };
  
  const handleMouseEnter = (rating) => {
    if (editable) {
      setHoverValue(rating);
    }
  };
  
  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="star-rating">
      <div 
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            className={`${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!editable}
            data-testid={`star-${rating}`}
          >
            <Star
              size={size}
              className={`${
                rating <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {value > 0 ? value.toFixed(1) : '0.0'}
        </span>
      )}
      {totalRatings !== null && (
        <span className="text-sm text-gray-400 ml-1">
          ({totalRatings})
        </span>
      )}
    </div>
  );
}

/**
 * RatingDisplay - Shows rating summary with bar distribution
 */
export function RatingDisplay({ 
  averageRating = 0, 
  totalRatings = 0, 
  distribution = {},
  showDistribution = true 
}) {
  const distributionBars = [5, 4, 3, 2, 1];
  
  return (
    <div className="space-y-3" data-testid="rating-display">
      {/* Main Rating */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-[#1A2F3A]">
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </p>
          <StarRating value={averageRating} size={16} showValue={false} />
          <p className="text-sm text-gray-500 mt-1">{totalRatings} reviews</p>
        </div>
        
        {/* Distribution Bars */}
        {showDistribution && totalRatings > 0 && (
          <div className="flex-1 space-y-1.5">
            {distributionBars.map((stars) => {
              const count = distribution[stars] || 0;
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-gray-500">{stars}</span>
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-400 text-xs">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * RatingForm - Form to submit a new rating
 */
export function RatingForm({ 
  onSubmit, 
  loading = false,
  ratedUserName = 'this user',
  contextLabel = ''
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, review });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="rating-form">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rate {ratedUserName} {contextLabel && `for ${contextLabel}`}
        </label>
        <StarRating 
          value={rating} 
          onChange={setRating} 
          editable 
          size={32}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Write a review (optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A] resize-none"
          data-testid="review-textarea"
        />
      </div>
      
      <button
        type="submit"
        disabled={rating === 0 || loading}
        className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="submit-rating-btn"
      >
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}
