const CopyPlugin = require('copy-webpack-plugin')

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' // Disable PWA in development
})


module.exports = withPWA({
  reactStrictMode: false,
  images: { unoptimized: true }, // disable next/image optimization as doesn't work with static export
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
