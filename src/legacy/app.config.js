'use strict';

angular.
  module('phonecatApp').
  config(['$routeProvider',
    function config($routeProvider) {
      $routeProvider.
        when('/phones', {
          template: '<phone-list></phone-list>'
        }).
        when('/phones/:phoneId', {
          // The React component gets the id as a prop instead of injecting $routeParams.
          template: '<phone-detail phone-id="$resolve.phoneId"></phone-detail>',
          resolve: {
            phoneId: ['$route', function($route) {
              return $route.current.params.phoneId;
            }]
          }
        }).
        otherwise('/phones');
    }
  ]);
