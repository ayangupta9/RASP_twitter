# Image Sensitivity Detector Chrome Extension

A Chrome extension that automatically detects and analyzes the sensitivity of images on social media platforms using a machine learning model. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🖼️ Real-time image sensitivity detection
- 🔍 Support for Twitter, Instagram, and Facebook
- 🎨 Beautiful UI with shadcn/ui components
- 🚀 Fast and responsive
- 🔒 Privacy-focused local processing

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Chrome](https://www.google.com/chrome/) browser

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd image-sensitivity-detector
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist` folder from your project directory

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The extension will automatically rebuild when you make changes
   - You may need to refresh the extension in `chrome://extensions/`
   - Click the refresh icon on the extension card

## Project Structure

```
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── PopupContent.tsx # Main popup component
├── src/
│   ├── lib/           # Utility functions
│   ├── popup.html     # Popup HTML template
│   ├── popup.tsx      # Popup entry point
│   └── style.css      # Global styles
├── background.js      # Extension background script
├── content.js         # Content script for social media sites
├── manifest.json      # Extension manifest
└── vite.config.ts     # Vite configuration
```

## Server Setup

The extension requires a local server running for image analysis. Follow these steps:

1. Clone and set up the server repository (separate repository)
2. Install server dependencies
3. Start the server on port 3000
4. The extension will automatically connect to `http://localhost:3000`

## Building for Production

1. Build the extension:
   ```bash
   npm run build
   ```

2. The production-ready extension will be in the `dist` folder
3. You can then:
   - Load it as an unpacked extension
   - Package it for the Chrome Web Store

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
