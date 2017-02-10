(function(){
	'use strict';
	var inventarioModule = angular.module('InventarioModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
	inventarioModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/inventario',{
			templateUrl: 'src/inventario/views/inventario.html',
			controller: 'InventarioCtrl'
		});
	}]);
})();