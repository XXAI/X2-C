(function(){
	'use strict';
	var configuracionModule = angular.module('ConfiguracionModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
	configuracionModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/configuracion',{
			templateUrl: 'src/admin/configuracion/views/configuracion.html',
			controller: 'ConfiguracionCtrl',
		});
	}]);
})();