import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Chrome extension manifest
const manifest = {
  manifest_version: 3,
  name: "Image Sensitivity Detector",
  version: "1.0",
  description: "Automatically detects and analyzes image sensitivity on social media platforms",
  permissions: [
    "activeTab",
    "scripting",
    "storage",
    "tabs",
    "system.display",
    "windows"
  ],
  host_permissions: [
    "*://*.x.com/*",
    "*://*.instagram.com/*",
    "*://*.facebook.com/*",
    "http://localhost:3000/*"
  ],
  background: {
    service_worker: "background.js",
    type: "module"
  },
  content_scripts: [
    {
      matches: [
        "*://*.x.com/*",
        "*://*.instagram.com/*",
        "*://*.facebook.com/*"
      ],
      js: ["content.js"]
    }
  ],
  action: {
    default_popup: "src/popup.html",
    default_icon: {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  icons: {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      enforce: 'post',
      closeBundle: async () => {
        // Ensure dist directory exists
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }

        // Write manifest.json
        fs.writeFileSync(
          'dist/manifest.json',
          JSON.stringify(manifest, null, 2)
        );

        // Copy background.js and content.js
        try {
          fs.copyFileSync('background.js', 'dist/background.js');
          fs.copyFileSync('content.js', 'dist/content.js');
          
          // Create placeholder icons (you should replace these with actual icons)
          const iconSizes = [16, 48, 128];
          iconSizes.forEach(size => {
            fs.writeFileSync(
              `dist/icon${size}.png`,
              Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==', 'base64')
            );
          });
          
          console.log('Successfully copied extension files to dist directory');
        } catch (error) {
          console.error('Error copying files:', error);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Changed to false to prevent deleting copied files
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});