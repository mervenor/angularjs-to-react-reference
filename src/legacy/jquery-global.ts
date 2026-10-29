import jQuery from 'jquery';

// AngularJS only uses jQuery (instead of its built-in jqLite) if it finds
// `window.jQuery` at the moment angular.js runs. The image animation in
// app.animations.js needs jQuery's `.animate()`, so this module must be
// imported before 'angular'.
Object.assign(window, { jQuery, $: jQuery });
