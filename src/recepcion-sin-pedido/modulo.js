(function(){
	'use strict';
	var recepcionModule = angular.module('RecepcionLibreModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
	recepcionModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/recepcion-sin-pedido',{
			templateUrl: 'src/recepcion-sin-pedido/views/lista.html',
			controller: 'RecepcionLibreCtrl',
		})
		.when('/recepcion-sin-pedido/entrada',{
			templateUrl: 'src/recepcion-sin-pedido/views/recepcion.html',
			controller: 'FormRecepcionLibreCtrl',
		})
		.when('/recepcion-sin-pedido/:id/entrada',{
			templateUrl: 'src/recepcion-sin-pedido/views/recepcion.html',
			controller: 'FormRecepcionLibreCtrl',
		});
	}]);
})();