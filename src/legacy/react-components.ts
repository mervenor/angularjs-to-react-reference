import angular from 'angular';
import { reactComponent } from '../bridge/reactComponent';
import { PhoneList } from '../phone-list/PhoneList';

/*
 * React components registered under their old AngularJS names. The route
 * templates in app.config.js do not change: `<phone-list>` simply renders
 * React now.
 */
angular.module('phoneList').component('phoneList', reactComponent(PhoneList));
