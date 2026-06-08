// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera .next/standalone — requerido por Railway/Docker para deploy eficiente
  output: 'standalone',

  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) return []

    const firebaseProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? ''

    const csp = [
      "default-src 'self'",
      [
        "script-src",
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://apis.google.com",
        "https://appleid.apple.com",
        "https://connect.facebook.net",
        "https://www.facebook.com",
      ].join(' '),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      [
        "frame-src",
        "'self'",
        "https://accounts.google.com",
        "https://appleid.apple.com",
        "https://www.facebook.com",
        "https://facebook.com",
        firebaseProject ? `https://${firebaseProject}.firebaseapp.com` : '',
      ].filter(Boolean).join(' '),
      [
        "connect-src",
        "'self'",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "https://*.firebase.google.com",
        "https://*.firebasestorage.googleapis.com",
        "https://*.railway.app",
        "https://*.up.railway.app",
        "http://localhost:3000",
        "http://localhost:3001",
      ].join(' '),
      [
        "img-src",
        "'self'",
        "data:",
        "blob:",
        "https://*.googleusercontent.com",
        "https://*.fbcdn.net",
        "https://*.facebook.com",
        "https://*.firebasestorage.googleapis.com",
      ].join(' '),
      "form-action 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ].map(d => d.trim()).join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',   value: csp },
          { key: 'X-Frame-Options',            value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
    ],
  },

  poweredByHeader: false,
}

export default nextConfig
