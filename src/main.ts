import 'bootstrap/dist/css/bootstrap.css';
import './styles/app.css';
import './styles/app.animations.css';
import { bootstrapLegacyApp } from './legacy';

// AngularJS still owns the page. React components join it one screen at a
// time through the bridge in src/bridge.
bootstrapLegacyApp(document.body);
