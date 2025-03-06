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
    "windows",
    "webNavigation"
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
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
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
        
        // Ensure icons directory exists in dist
        if (!fs.existsSync('dist/icons')) {
          fs.mkdirSync('dist/icons', { recursive: true });
        }

        // Write manifest.json
        fs.writeFileSync(
          'dist/manifest.json',
          JSON.stringify(manifest, null, 2)
        );

        // Copy background.js and content.js
        try {
          fs.copyFileSync('src/extension_helpers/background.js', 'dist/background.js');
          fs.copyFileSync('src/extension_helpers/content.js', 'dist/content.js');
          
          // Copy icons from public/icons to dist/icons
          const iconSizes = [16, 48, 128];
          iconSizes.forEach(size => {
            const iconPath = `public/icons/icon${size}.png`;
            const destPath = `dist/icons/icon${size}.png`;
            
            if (fs.existsSync(iconPath)) {
              fs.copyFileSync(iconPath, destPath);
              console.log(`Copied icon: ${iconPath} -> ${destPath}`);
            } else {
              console.warn(`Warning: Icon not found at ${iconPath}`);
            }
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
    emptyOutDir: false, // Keep false to prevent deleting copied files
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
  },
  publicDir: 'public' // Ensure Vite knows about the public directory
});