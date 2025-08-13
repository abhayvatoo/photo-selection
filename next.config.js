/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // Bundle size optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@prisma/client']
  },
  // Enable compression and tree shaking
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // Optimize imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}'
    }
  }
}

module.exports = nextConfig
