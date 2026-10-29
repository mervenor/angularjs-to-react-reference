import 'bootstrap/dist/css/bootstrap.css';
import './styles/app.css';
import './styles/app.animations.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { legacyHashToPath } from './legacyUrls';
import { routes } from './routes';

// Old bookmarks and links use AngularJS hash URLs (/index.html#!/phones/nexus-s).
// Rewrite them before the router starts, so it only ever sees clean paths.
const legacyPath = legacyHashToPath(window.location.href);
if (legacyPath) window.history.replaceState(null, '', legacyPath);

const root = document.getElementById('root');
if (!root) throw new Error('index.html must contain <div id="root">');

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={createBrowserRouter(routes)} />
  </StrictMode>,
);
