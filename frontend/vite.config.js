import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        /**
         * Bundle analyzer - generates stats.html
         * Run: ANALYZE=true npm run build
         */
        ...(process.env.ANALYZE ? [visualizer({
                filename: 'stats.html',
                open: true,
                gzipSize: true,
            })] : []),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,mp4}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\./,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
                        },
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                        },
                    },
                ],
            },
            manifest: {
                name: 'Kioto E-commerce',
                short_name: 'Kioto',
                description: 'Tienda online de productos',
                theme_color: '#0a0a0a',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: '/logo.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": "/src",
            "@shared": "/shared/src",
        },
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Core React libraries
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'vendor-react';
                    }
                    // Router
                    if (id.includes('node_modules/react-router')) {
                        return 'vendor-router';
                    }
                    // React Query
                    if (id.includes('@tanstack/react-query')) {
                        // Devtools should be in separate chunk (only in dev)
                        if (id.includes('devtools')) {
                            return 'dev-tools';
                        }
                        return 'vendor-query';
                    }
                    // Zustand (lightweight state)
                    if (id.includes('node_modules/zustand')) {
                        return 'vendor-state';
                    }
                    // Admin-only heavy dependencies
                    if (id.includes('node_modules/recharts')) {
                        return 'admin-charts';
                    }
                    // Admin pages (only load when visiting /admin)
                    if (id.includes('src/pages/admin')) {
                        return 'admin-pages';
                    }
                    // UI icons and utils
                    if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
                        return 'vendor-ui';
                    }
                    // HTTP client and utilities
                    if (id.includes('axios') || id.includes('date-fns')) {
                        return 'vendor-utils';
                    }
                    // Socket.io
                    if (id.includes('socket.io-client')) {
                        return 'vendor-socket';
                    }
                    // Stripe
                    if (id.includes('@stripe')) {
                        return 'vendor-stripe';
                    }
                },
            },
        },
        // Optimize chunk sizes
        chunkSizeWarningLimit: 1000,
        // Enable minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
                drop_debugger: true,
            },
        },
    },
});
