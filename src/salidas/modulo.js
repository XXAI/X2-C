(function(){
	'use strict';
	var salidasModule = angular.module('SalidasModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
    salidasModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){

		$routeProvider.when('/salidas',{
			templateUrl: 'src/salidas/views/lista.html',
			controller: 'SalidasCtrl'
		})
		.when('/salidas/:id/editar',{
			templateUrl: 'src/salidas/views/editar.html',
			controller: 'FormActaCtrl'
		})
		.when('/salidas/nuevo',{
			templateUrl: 'src/salidas/views/nuevo.html',
			controller: 'FormSalidaCtrl'
		});
	}]);
})();