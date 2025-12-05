/** @type {import('next').NextConfig} */
const nextConfiguration = {
  // Static export for Electron production builds
  output: 'export',

  // Preserve your existing configuration
  images: {
    unoptimized: true,
  },

  // Add webpack configuration to fix the Handlebars warning
  webpack: (config: any, { _isServer }: { _isServer: boolean }) => {
    // Add a fallback for the problematic module
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};

    // Option 1: Ignore handlebars completely
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: false,
    };

    // Option 2: Or create a null loader for handlebars
    config.module.rules.push({
      test: /node_modules\/handlebars\/lib\/index\.js$/,
      use: 'null-loader',
    });

    return config;
  },
};

require('dotenv').config();
module.exports = nextConfiguration;
