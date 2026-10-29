import './styles/base.css';
import './styles/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { legacyHashToPath } from './legacyUrls';
import { AppRoutes } from './routes';

// Old bookmarks and links use AngularJS hash URLs (/index.html#!/phones/nexus-s).
// Rewrite them before the router starts, so it only ever sees clean paths.
const legacyPath = legacyHashToPath(window.location.href);
if (legacyPath) window.history.replaceState(null, '', legacyPath);

const root = document.getElementById('root');
if (!root) throw new Error('index.html must contain <div id="root">');

// Declarative mode: we use no loaders or actions, and it is about 17 kB
// (gzipped) smaller than createBrowserRouter + RouterProvider.
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
);
