/*
 * Loads the original AngularJS app through the bundler instead of eleven
 * <script> tags. The order matters and mirrors the original index.html.
 */
import './jquery-global';
import angular from 'angular';
import 'angular-animate';
import 'angular-resource';
import 'angular-route';

import './app.module.js';
import './app.config.js';
import './app.animations.js';
import './core/core.module.js';
import './core/checkmark/checkmark.filter.js';
import './core/phone/phone.module.js';
import './core/phone/phone.service.js';
import './phone-list/phone-list.module.js';
import './phone-detail/phone-detail.module.js';
import './phone-detail/phone-detail.component.js';
import './templates';
import './react-components';

export function bootstrapLegacyApp(element: Element) {
  // strictDi: fail fast if any injectable is not annotated (they all are).
  angular.bootstrap(element, ['phonecatApp'], { strictDi: true });
}
