'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Flame, Star } from 'lucide-react'

interface SocialActivity {
  id: string
  userName: string
  action: 'meal_complete' | 'training_complete' | 'goal_reached' | 'streak_milestone'
  goal: string
  timeAgo: string
  score: number
}

interface SocialPulseProps {
  lang: string
}

// Mock data - in production, this would come from an API
const mockActivities: SocialActivity[] = [
  {
    id: '1',
    userName: 'Alex',
    action: 'goal_reached',
    goal: '達成3天連続',
    timeAgo: '5分前',
    score: 50
  },
  {
    id: '2',
    userName: 'Jordan',
    action: 'training_complete',
    goal: '完成上肢訓練',
    timeAgo: '15分前',
    score: 15
  },
  {
    id: '3',
    userName: 'Casey',
    action: 'meal_complete',
    goal: '完成健身餐單',
    timeAgo: '32分前',
    score: 10
  },
  {
    id: '4',
    userName: 'Morgan',
    action: 'streak_milestone',
    goal: '達到100天連续',
    timeAgo: '1小時前',
    score: 100
  },
]

export default function SocialPulse({ lang }: SocialPulseProps) {
  const [activities, setActivities] = useState<SocialActivity[]>([])

  useEffect(() => {
    // Map English goal text for display
    setActivities(mockActivities.map(a => ({
      ...a,
      goal: lang === 'zh' ? a.goal : (
        a.action === 'goal_reached' ? '3-Day Streak' :
        a.action === 'training_complete' ? 'Upper Body Workout' :
        a.action === 'meal_complete' ? 'Meal Plan Complete' :
        '100-Day Streak'
      )
    })))
  }, [lang])

  const getActivityIcon = (action: SocialActivity['action']) => {
    switch (action) {
      case 'meal_complete':
        return <Heart size={14} className="text-red-400" />
      case 'training_complete':
        return <Flame size={14} className="text-amber-400" />
      case 'goal_reached':
        return <Star size={14} className="text-yellow-400" />
      case 'streak_milestone':
        return <Flame size={14} className="text-purple-400" />
    }
  }

  const getActivityLabel = (action: SocialActivity['action']) => {
    if (lang === 'zh') {
      switch (action) {
        case 'meal_complete':
          return '完成餐單'
        case 'training_complete':
          return '完成訓練'
        case 'goal_reached':
          return '達成目標'
        case 'streak_milestone':
          return '里程碑'
      }
    } else {
      switch (action) {
        case 'meal_complete':
          return 'Meal Complete'
        case 'training_complete':
          return 'Workout Done'
        case 'goal_reached':
          return 'Goal Reached'
        case 'streak_milestone':
          return 'Milestone'
      }
    }
  }

  return (
    <div className="card-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="text-lg">👥</span>
          {lang === 'zh' ? '社群脈搏' : 'Community Pulse'}
        </h3>
        <span className="text-xs font-bold text-[#0F9E75] animate-pulse">
          {lang === 'zh' ? '即時' : 'LIVE'}
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities.map((activity, idx) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            <div className="shrink-0 p-2 rounded-lg bg-white dark:bg-slate-600">
              {getActivityIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                {activity.userName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {activity.goal}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-[#0F9E75]">+{activity.score}</p>
              <p className="text-[10px] text-slate-400">{activity.timeAgo}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
        {lang === 'zh' ? '與全球健身者一起成長' : 'Growing together with fitness community'}
      </p>
    </div>
  )
}
