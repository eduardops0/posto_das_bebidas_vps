import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/index.css', 'resources/css/app.css',  'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',

            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '127.0.0.1',
        cors: true,
        proxy: {
            '/admin': 'http://127.0.0.1:8000',
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
