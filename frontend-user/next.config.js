/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
    reactStrictMode: true,
    images: {
        domains: ['localhost'],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    },
}

module.exports = nextConfig
