'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Flame, Heart, ImagePlus, MessageCircle, Sparkles } from 'lucide-react'
import type { ForumPostItem } from '@/lib/types'

type Filter = 'hot' | 'mine' | 'following'

export default function ForumPage() {
  const { data: session } = useSession()
  const [filter, setFilter] = useState<Filter>('hot')
  const [posts, setPosts] = useState<ForumPostItem[]>([])
  const [content, setContent] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const loadPosts = useCallback(async (nextFilter = filter) => {
    const res = await fetch(`/api/community/forum?filter=${nextFilter}`)
    const data = await res.json()
    setPosts(data.posts ?? [])
  }, [filter])

  useEffect(() => {
    loadPosts(filter)
  }, [filter, loadPosts])

  async function handleImageUpload(file?: File | null) {
    if (!file) return
    setUploading(true)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result !== 'string') return reject(new Error('Failed to read file'))
        resolve(result.split(',')[1] ?? '')
      }
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
    const res = await fetch('/api/blob/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, base64 }),
    })
    const data = await res.json()
    setImageUrl(data.url ?? null)
    setUploading(false)
  }

  async function handlePost(isCheckIn = false) {
    if (!content.trim()) return
    await fetch('/api/community/forum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        mealImage: imageUrl,
        isCheckIn,
      }),
    })
    setContent('')
    setImageUrl(null)
    loadPosts(filter)
  }

  async function toggleLike(postId: string) {
    await fetch(`/api/community/forum/${postId}/like`, { method: 'POST' })
    loadPosts(filter)
  }

  async function sendReply(postId: string) {
    const content = replyDrafts[postId]
    if (!content?.trim()) return
    await fetch(`/api/community/forum/${postId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setReplyDrafts((prev) => ({ ...prev, [postId]: '' }))
    loadPosts(filter)
  }

  return (
    <div className="py-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#E8F5F0] flex items-center justify-center">
          <Sparkles size={18} className="text-[#0F9E75]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">MacroDay Forum</h1>
          <p className="text-xs text-slate-400">Share meals, streaks, and progress with the community.</p>
        </div>
      </div>

      <div className="card-lg p-5 space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share today's meal, your streak, or a check-in..."
          className="w-full min-h-28 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 focus:outline-none focus:border-[#0F9E75]"
        />
        {imageUrl && (
          <div className="relative h-48 overflow-hidden rounded-2xl">
            <Image src={imageUrl} alt="uploaded meal" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <label className="px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)} />
            <span className="inline-flex items-center gap-2"><ImagePlus size={14} /> {uploading ? 'Uploading...' : 'Add meal photo'}</span>
          </label>
          <button onClick={() => handlePost(false)} className="px-5 py-3 rounded-2xl bg-[#0F9E75] text-white text-sm font-black">
            Publish post
          </button>
          <button onClick={() => handlePost(true)} className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-black">
            Daily check-in
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['hot', 'mine', 'following'] as Filter[]).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-full text-sm font-bold ${filter === value ? 'bg-[#0F9E75] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            {value === 'hot' ? 'Hot posts' : value === 'mine' ? 'My posts' : 'Following'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="card-lg p-5 space-y-4">
            <div className="flex items-center gap-3">
              {post.user.image ? (
                <Image src={post.user.image} alt={post.user.name ?? 'avatar'} width={40} height={40} className="rounded-2xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-[#E8F5F0] flex items-center justify-center text-[#0F9E75] font-black">
                  {(post.user.name ?? post.user.email ?? '?')[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{post.user.name ?? post.user.email}</p>
                <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
              {post.isCheckIn && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FFF8E6] text-[#E09B20]">Check-in</span>
              )}
            </div>

            <p className="text-sm leading-6 text-slate-700">{post.content}</p>

            {post.mealImage && (
              <div className="relative h-64 overflow-hidden rounded-2xl">
                <Image src={post.mealImage} alt="meal post" fill className="object-cover" unoptimized />
              </div>
            )}

            <div className="flex gap-3 text-sm">
              <button onClick={() => toggleLike(post.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-slate-600">
                <Heart size={14} className={post.likedByMe ? 'fill-red-500 text-red-500' : ''} />
                {post.likesCount}
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-slate-600">
                <MessageCircle size={14} />
                {post.replyCount}
              </div>
              {typeof post.streakSnapshot === 'number' && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E8F5F0] text-[#0F9E75]">
                  <Flame size={14} />
                  {post.streakSnapshot} day streak
                </div>
              )}
            </div>

            <div className="space-y-3">
              {post.replies.map((reply) => (
                <div key={reply.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-bold text-slate-700 mb-1">{reply.user.name ?? reply.user.email}</p>
                  <p className="text-sm text-slate-600">{reply.content}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={replyDrafts[post.id] ?? ''}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Reply to this post..."
                  className="flex-1 h-11 rounded-2xl border border-slate-200 px-4 text-sm focus:outline-none focus:border-[#0F9E75]"
                />
                <button onClick={() => sendReply(post.id)} className="px-4 rounded-2xl bg-slate-900 text-white text-sm font-bold">
                  Reply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
