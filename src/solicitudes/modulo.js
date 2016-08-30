(function(){
	'use strict';
	var solicitudesModule = angular.module('SolicitudesModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
	solicitudesModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/solicitudes',{
			templateUrl: 'src/solicitudes/views/lista.html',
			controller: 'SolicitudesCtrl',
		})
		.when('/solicitudes/:id/editar',{
			templateUrl: 'src/solicitudes/views/editar.html',
			controller: 'FormSolicitudCtrl',
		})
		.when('/solicitudes/nuevo',{
			templateUrl: 'src/solicitudes/views/nuevo.html',
			controller: 'FormSolicitudCtrl',
		});
	}]);
})();