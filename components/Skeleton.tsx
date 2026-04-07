'use client'

import { motion } from 'framer-motion'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-slate-100 animate-pulse rounded-lg ${className}`} />
  )
}

export function MealCardSkeleton() {
  return (
    <div className="card-lg overflow-hidden border-slate-50 animate-pulse">
      <div className="w-full h-52 bg-slate-100" />
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-6 w-16" />)}
        </div>
        <div className="flex gap-2.5">
           <Skeleton className="flex-1 h-12 rounded-2xl" />
           <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
       <Skeleton className="w-full h-52 rounded-3xl" />
       <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
       </div>
       <Skeleton className="w-full h-40 rounded-2xl" />
    </div>
  )
}
