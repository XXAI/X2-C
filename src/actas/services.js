(function(){
	'use strict';
	angular.module('ActasModule')
	   .factory('ActasDataApi', ['$http', 'URLS', function ($http, URLS) {
	       return {
	           lista: function (params,success, error) {
	               $http.get(URLS.BASE_API + '/actas',{params:params}).success(success).error(error)
	           },
			   ver: function (id, success, error) {
	               $http.get(URLS.BASE_API + '/actas/' + id).success(success).error(error)
	           },
	           cargarConfiguracion: function (id, success, error) {
	               $http.get(URLS.BASE_API + '/configuracion/' + id).success(success).error(error)
	           },
			   crear: function (data, success, error) {
	               $http.post(URLS.BASE_API + '/actas', data).success(success).error(error)
	           },
			   editar: function (id, data, success, error) {
	               $http.put(URLS.BASE_API + '/actas/' + id, data).success(success).error(error)
	           },
			   eliminar: function (id,  success, error) {
	               $http.delete(URLS.BASE_API + '/actas/' + id).success(success).error(error)
	           }
	       };
	   }
	]);
})();