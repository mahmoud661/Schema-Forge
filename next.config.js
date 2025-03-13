/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Make sure we're not using the 'export' output
  // which requires all dynamic paths to be known at build time
  output: 'standalone',
  
  // Enable appropriate experimental features if needed
  experimental: {
    // This may help with certain dynamic rendering scenarios
    serverActions: true,
  },
}

module.exports = nextConfig
