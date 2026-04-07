export interface InBodyRecord {
  id: string
  date: string
  // Required
  weight: number
  height: number
  gender: 'male' | 'female'
  age: number
  // Optional (from InBody machine)
  bodyFat?: number
  skeletalMuscleMass?: number
  bmr?: number
  visceralFatLevel?: number
  bodyWater?: number
}

export interface UserProfile {
  goal: 'muscle_gain' | 'fat_loss' | 'maintain'
  dietaryRestrictions: string[]
  // Food preferences
  proteinPreferences: string[]   // e.g. ['chicken', 'fish', 'pork']
  carbPreferences: string[]      // e.g. ['rice', 'noodles']
  cuisinePreferences: string[]   // e.g. ['HK Café', 'Japanese']
  cookingStyle: 'home' | 'takeout' | 'both'
  weeklyBudget?: number
  isPro: boolean
}

export interface Meal {
  name: string
  cookingTime: number
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  steps: string[]
  // Optional enrichments
  isTakeout?: boolean
  whereToGet?: string     // e.g. "McDonald's", "任何茶餐廳"
  imageUrl?: string
  imagePrompt?: string    // English visual description for image generation
  isEaten?: boolean
}

export interface DailyMeals {
  date: string           // YYYY-MM-DD
  breakfast: Meal
  lunch: Meal
  dinner: Meal
  targetCalories: number
  targetProtein: number
}

export interface DayPlan {
  date: string
  breakfast: Meal
  lunch: Meal
  dinner: Meal
  snack?: Meal
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export interface WeeklyPlan {
  id: string
  createdAt: string
  days: DayPlan[]
  shoppingList: ShoppingItem[]
  targetCalories: number
  targetProtein: number
}

export interface ShoppingItem {
  name: string
  amount: string
  category: 'protein' | 'vegetables' | 'carbs' | 'dairy' | 'condiments' | 'other'
}

export interface UsageRecord {
  date: string
  count: number
}

export interface GuestSession {
  id: string        // e.g. "guest_A3X9K2PQ"
  isGuest: boolean
  createdAt: string
}
