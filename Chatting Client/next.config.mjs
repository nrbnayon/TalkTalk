/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
      },

      // Firebase Storage
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },

      // AWS S3
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },

      // Google Cloud Storage
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },

      // Azure Blob Storage
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },

      // General image hosting services
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },

      // Your own domain
      {
        protocol: "https",
        hostname: "your-domain.com",
      },
    ],
  },
  experimental: {
    turbo: {
      rules: {
        jsx: [],
      },
    },
  },
};

export default nextConfig;
