import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    // Удалите эту строку или закомментируйте:
    // base: '/admin/',
    
    // Для поддомена base должен быть '/' или можно вообще не указывать
    base: '/', // или просто удалите эту строку
    
    server: {
        host: '::',
        port: 8090,
    },
    plugins: [react(), mode === 'development' && componentTagger()].filter(
        Boolean
    ),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
            },
        },
    },
}));