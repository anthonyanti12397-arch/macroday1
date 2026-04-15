import { z } from 'zod'

export const InBodySchema = z.object({
  weight: z.number().positive(),
  height: z.number().positive(),
  age: z.number().int().positive(),
  gender: z.enum(['male', 'female']),
  bodyFat: z.number().min(3).max(60).nullable().optional(),
  skeletalMuscleMass: z.number().positive().nullable().optional(),
  bmr: z.number().positive().nullable().optional(),
  visceralFatLevel: z.number().int().min(1).max(20).nullable().optional(),
})

export const UserProfileSchema = z.object({
  goal: z.enum(['fat_loss', 'maintenance', 'muscle_gain']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  dietaryRestrictions: z.array(z.string()),
  dislikedIngredients: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  preferredCuisine: z.string().optional(),
})

export const GenerateMealsSchema = z.object({
  inbody: InBodySchema,
  profile: UserProfileSchema,
  availableIngredients: z.array(z.string()).optional(),
  lang: z.string().optional().default('zh'),
  isTakeoutMode: z.boolean().optional().default(false),
  locationContext: z.string().optional().default(''),
})

export const GenerateDailySchema = z.object({
  inbody: InBodySchema,
  profile: UserProfileSchema,
  lang: z.enum(['zh', 'en']).optional().default('zh'),
  hasTraining: z.boolean().optional().default(false),
  estimatedCaloriesBurned: z.number().optional(),
  isTakeoutMode: z.boolean().optional().default(false),
  locationContext: z.string().optional().default(''),
})
