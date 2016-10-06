(function(){
	'use strict';
	var requisicionesunidadesModule = angular.module('RequisicionesUnidadesModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
        requisicionesunidadesModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/requisicionesunidades',{
			templateUrl: 'src/requisicionesunidades/views/lista.html',
			controller: 'RequisicionesUnidadCtrl'
		})
		.when('/requisicionesunidades/:id/editar',{
			templateUrl: 'src/requisicionesunidades/views/editar.html',
			controller: 'FormUnidadMedicaCtrl'
		})
		.when('/requisicionesunidades/nuevo',{
			templateUrl: 'src/requisicionesunidades/views/nuevo.html',
			controller:  'FormUnidadMedicaCtrl'
		});
	}]);
})();