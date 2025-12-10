import React from 'react';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-1/4"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-1/3"></div></td>
  </tr>
);

const BoothListSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
          <tr>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">UID</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
      </table>
    </div>
  );
};

export default BoothListSkeleton;