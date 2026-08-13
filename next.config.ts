import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app ships only project-owned static images. Serving them directly
  // avoids the Worker image optimizer in local development, where the ASSETS
  // binding is not available to the preview runtime.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
