/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite importar el paquete compartido (TS sin transpilar) desde el monorepo.
  transpilePackages: ['@protea/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      // URLs públicas de objetos de Firebase Storage tras makePublic()
      // (las que genera scripts/upload-portfolio.mjs para el portafolio).
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  webpack: (config) => {
    // El paquete `@protea/shared` usa extensiones `.js` en sus imports
    // (obligatorio para el resolver Node16 de las Cloud Functions). Webpack
    // debe resolver esos `.js` a los archivos `.ts` fuente del monorepo.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
