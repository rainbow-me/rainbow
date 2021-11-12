const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true, // https://github.com/vercel/next.js/pull/22867
  },
  reactStrictMode: true,
};

module.exports = withVanillaExtract(nextConfig);
