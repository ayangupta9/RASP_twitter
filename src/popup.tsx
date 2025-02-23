import { createRoot } from 'react-dom/client';
import { PopupContent } from './components/PopupContent';
import './style.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<PopupContent />);