(function(){
	'use strict';
	var recepcionModule = angular.module('RecepcionModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
	recepcionModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/recepcion',{
			templateUrl: 'src/recepcion/views/lista.html',
			controller: 'RecepcionCtrl',
		})
		.when('/recepcion/:id/entrada',{
			templateUrl: 'src/recepcion/views/recepcion.html',
			controller: 'FormRecepcionCtrl',
		});
	}]);
})();