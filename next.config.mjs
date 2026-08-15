import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'general-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. ESTO ES VITAL PARA DOCKER
  output: 'standalone',

  // 2. IMPORTANTE: Si usas <Image /> con fotos de Supabase, agrega esto:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Permite cargar imágenes desde Supabase
      },
    ],
  },

  // 3. Cabeceras de seguridad. La app se sirve detrás de Traefik con TLS,
  // pero estas cabeceras las tiene que emitir la aplicación.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Evita que el navegador adivine el tipo MIME de una respuesta
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Impide que la app se embeba en un iframe (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // No filtrar la URL completa al navegar a sitios externos
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // La PWA no usa cámara, micrófono ni geolocalización
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Fuerza HTTPS durante un año (Traefik ya redirige, esto lo fija en el cliente)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
