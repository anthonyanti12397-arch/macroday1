import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SharePageClient from './SharePageClient'

interface Props {
  params: { userId: string }
}

async function fetchPublicData(userId: string) {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/user/public/${userId}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchPublicData(params.userId)
  if (!data) return { title: 'MacroDay' }

  const firstName = (data.name ?? 'Someone').split(' ')[0]
  const description = data.avgCalories > 0
    ? `${firstName} is tracking ${data.avgCalories} kcal/day • ${data.avgProtein}g protein • ${data.streak > 0 ? `🔥 ${data.streak} day streak` : ''} on MacroDay`
    : `${firstName} is meal planning with MacroDay`

  const ogUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/og?userId=${params.userId}`

  return {
    title: `${firstName}'s MacroDay Week`,
    description,
    openGraph: {
      title: `${firstName}'s MacroDay Week`,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${firstName}'s MacroDay Week`,
      description,
      images: [ogUrl],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const data = await fetchPublicData(params.userId)
  if (!data) notFound()
  return <SharePageClient data={data} />
}
