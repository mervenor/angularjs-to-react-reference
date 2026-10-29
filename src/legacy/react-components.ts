import angular from 'angular';
import { reactComponent } from '../bridge/reactComponent';
import { PhoneDetail } from '../phone-detail/PhoneDetail';
import { PhoneList } from '../phone-list/PhoneList';

/*
 * React components registered under their old AngularJS names, so the
 * route templates in app.config.js barely change.
 */
angular.module('phoneList').component('phoneList', reactComponent(PhoneList));
angular.module('phoneDetail').component('phoneDetail', reactComponent(PhoneDetail, ['phoneId']));
