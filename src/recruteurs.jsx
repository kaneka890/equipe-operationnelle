import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { useRoute } from './router.js';
import Espace from './espace/Espace.jsx';

// Page à part pour les recruteurs : le site public ne la montre ni n'y mène.
function App() {
  const { path } = useRoute();
  return <Espace chemin={path.startsWith('/espace') ? path : '/espace'} />;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
