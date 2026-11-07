/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    },
    images: {
        domains: ['localhost'],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
}

module.exports = nextConfig
