import '@fontsource-variable/inter';
import './estilos.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const raiz = document.getElementById('raiz');
if (raiz) createRoot(raiz).render(<App />);
