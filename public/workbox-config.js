// public/workbox-config.js
module.exports = {
  globDirectory: 'public/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,ico}',
  ],
  swDest: 'public/sw.js',
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/,
  ],
  runtimeCaching: [
    {
      urlPattern: new RegExp('https://story-api.dicoding.dev/v1/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
};