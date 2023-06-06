const CopyPlugin = require('copy-webpack-plugin')

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' // Disable PWA in development
})


module.exports = withPWA({
  experimental: {
    runtime: 'experimental-edge',
  },
  reactStrictMode: true,
  images: { unoptimized: true }, // disable next/image optimization as doesn't work with static export
  compiler: {
    styledComponents: true
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
  webpack: (config, { }) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: 'node_modules/onnxruntime-web/dist/*.wasm',
            to: 'static/chunks/pages/[name][ext]' 
          }
        ]
      })
    )

    return config
  }
})
