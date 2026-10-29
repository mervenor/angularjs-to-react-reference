import angular from 'angular';
import phoneDetailTemplate from './phone-detail/phone-detail.template.html?raw';
import phoneListTemplate from './phone-list/phone-list.template.html?raw';

// The components still use `templateUrl`. Pre-filling the template cache lets
// the bundler ship the templates with the code, with no extra requests and
// no changes to the original component files.
angular.module('phonecatApp').run([
  '$templateCache',
  ($templateCache: angular.ITemplateCacheService) => {
    $templateCache.put('phone-list/phone-list.template.html', phoneListTemplate);
    $templateCache.put('phone-detail/phone-detail.template.html', phoneDetailTemplate);
  },
]);
