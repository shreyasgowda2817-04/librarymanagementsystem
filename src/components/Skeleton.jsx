import React from 'react';

const Skeleton = ({ className, variant = 'rect' }) => {
  const baseClasses = "bg-slate-200 dark:bg-slate-800 animate-pulse";
  const variantClasses = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded h-4 w-full"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

export const DashboardSkeleton = () => (
  <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 space-y-10">
    {/* Hero Skeleton */}
    <Skeleton className="h-[360px] w-full rounded-xl" />
    
    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton variant="circle" className="w-12 h-12" />
          <Skeleton variant="text" className="w-1/2 h-8" />
          <Skeleton variant="text" className="w-full h-4" />
        </div>
      ))}
    </div>

    {/* Table Section Skeleton */}
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-10 border-b border-slate-50 dark:border-slate-200 dark:border-slate-800">
        <Skeleton variant="text" className="w-1/4 h-8" />
      </div>
      <div className="p-10 space-y-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-6">
            <Skeleton className="w-12 h-16" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-1/3" />
              <Skeleton variant="text" className="w-1/4" />
            </div>
            <Skeleton className="w-24 h-10" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
