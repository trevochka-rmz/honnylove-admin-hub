import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    base: '/admin/',
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
    // Опционально: для правильной генерации путей в сборке
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // Убедитесь что пути к assets генерируются правильно
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
            },
        },
    },
}));
