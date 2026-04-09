const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-[#1A2332] rounded-xl overflow-hidden shadow-sm ${className}`}>
      <div className="h-44 skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton-shimmer rounded w-3/4" />
        <div className="h-4 skeleton-shimmer rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-4 skeleton-shimmer rounded w-16" />
          <div className="h-4 skeleton-shimmer rounded w-16" />
          <div className="h-4 skeleton-shimmer rounded w-16" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
