(function(){
	'use strict';
	var recetasModule = angular.module('RecetasModule', ['ngMaterial','ngRoute','ngStorage','ngCookies','ngMessages','pascalprecht.translate','http-auth-interceptor']);
    recetasModule.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider){
		$routeProvider.when('/recetas',{
			templateUrl: 'src/recetas/views/lista.html',
			controller: 'RecetasCtrl'
		})
        .when('/recetas/nuevo',{
            templateUrl: 'src/recetas/views/form.html',
            controller: 'FormRecetasCtrl'
        })
        .when('/recetas/:id/editar',{
            templateUrl: 'src/recetas/views/form.html',
            controller: 'FormRecetasCtrl'
        });
	}]);
})();