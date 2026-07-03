import React from 'react';

export const PageSkeleton = () => {
  return (
    <div className="w-full min-h-[calc(100vh-100px)] p-6 space-y-6 animate-pulse">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-72"></div>
        </div>
        <div className="flex space-x-3">
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-10 w-32 bg-indigo-200 dark:bg-indigo-900/50 rounded-lg"></div>
        </div>
      </div>

      {/* Stats Cards Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area (Table/List) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
          <div className="h-10 w-64 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                  </div>
                </div>
                <div className="hidden md:block h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                <div className="hidden lg:block h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
