import { createRoot } from 'react-dom/client';
import { PopupContent } from './components/PopupContent';
import { ThemeProvider } from './components/ThemeProvider';
import './style.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <PopupContent />
  </ThemeProvider>
);