(function(){
	'use strict';
	var actasModule = angular.module('ActasModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
	actasModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/actas',{
			templateUrl: 'src/actas/views/lista.html',
			controller: 'ActasCtrl',
		})
		.when('/actas/:id/editar',{
			templateUrl: 'src/actas/views/editar.html',
			controller: 'FormActaCtrl',
		})
		.when('/actas/nuevo',{
			templateUrl: 'src/actas/views/nuevo.html',
			controller: 'FormActaCtrl',
		});
	}]);
})();