import React from 'react';

const SkeletonCard = () => (
  <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="h-5 bg-gray-700 rounded w-3/4"></div>
      <div className="h-5 bg-gray-700 rounded w-1/4"></div>
    </div>
    <div className="h-4 bg-gray-700 rounded w-1/2 mt-2"></div>
    <div className="mt-4 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-700 rounded w-full"></div>
    </div>
  </div>
);

const BoothGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
};

export default BoothGridSkeleton;