/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ethereum-entity-registry/ui"],
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
