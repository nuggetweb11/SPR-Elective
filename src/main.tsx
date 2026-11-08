import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Keep ligature names hidden until the Material Symbols webfont is ready.
if (typeof document !== 'undefined' && 'fonts' in document) {
  document.fonts.load('24px \"Material Symbols Outlined\"').then(() => {
    document.documentElement.classList.add('material-icons-ready');
  }).catch(() => {
    // Keep icons hidden rather than showing their textual ligature names.
  });
}

createRoot(document.getElementById('root')!).render(<App />);
