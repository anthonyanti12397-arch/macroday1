/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // SiliconFlow image generation (FLUX model outputs)
      { protocol: 'https', hostname: 's3.amazonaws.com', pathname: '/siliconflow-image/**' },
      { protocol: 'https', hostname: '*.siliconflow.cn' },
      { protocol: 'https', hostname: '*.siliconflow.com' },
      // Together AI image generation
      { protocol: 'https', hostname: '*.together.xyz' },
      { protocol: 'https', hostname: 'api.together.xyz' },
      // Google profile pictures
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Vercel Blob Storage (for user uploads)
      { protocol: 'https', hostname: '*.vercel-storage.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
}

export default nextConfig
