/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    domains: ["cdn.builder.io"],
    dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig;
