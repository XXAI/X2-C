(function(){
	'use strict';
	var requisicionesModule = angular.module('RequisicionesModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
	requisicionesModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/requisiciones',{
			templateUrl: 'src/requisiciones/views/requisicion.html',
			controller: 'RequisicionesCtrl',
		});
	}]);
})();