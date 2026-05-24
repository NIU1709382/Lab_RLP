// src/components/dashboard/DashboardSkeleton.jsx
"use client";

import Skeleton from "@/components/ui/Skeleton";

export default function DashboardSkeleton({ dark }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} dark={dark} className="h-32" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton dark={dark} className="h-48 col-span-2" />
        <Skeleton dark={dark} className="h-48" />
      </div>
    </div>
  );
}