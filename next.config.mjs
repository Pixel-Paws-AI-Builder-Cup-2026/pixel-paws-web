/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // small self-contained server for the Cloud Run Docker image
  images: { unoptimized: true },
};

export default nextConfig;
