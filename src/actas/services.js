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
				checarActaNueva: function (id, success, error) {
					$http.get(URLS.BASE_API + '/actas/hay-acta-nueva/' + id).success(success).error(error)
				},
				cargarConfiguracion: function (id, success, error) {
					$http.get(URLS.BASE_API + '/configuracion/' + id).success(success).error(error)
				},
				crear: function (data, success, error) {
					$http.post(URLS.BASE_API + '/actas', data).success(success).error(error)
				},
				importar: function (file, success, error) {
					var fd = new FormData();
					fd.append('zipfile', file);
					$http.post(URLS.BASE_API + '/importar-csv', fd, {
						transformRequest: angular.identity,
						headers: {'Content-Type': undefined}
					}).success(success).error(error);
				},
				clonarActa: function(id,success,error){
					$http.put(URLS.BASE_API + '/clonar-acta/' + id).success(success).error(error)
				},
				clonarActaJurisdiccion: function(id,success,error){
					$http.put(URLS.BASE_API + '/clonar-acta-jurisdiccion/' + id).success(success).error(error)
				},
				sincronizar: function (id, success, error) {
	               $http.get(URLS.BASE_API + '/sincronizar-validacion/' + id).success(success).error(error)
	           	},
				editar: function (id, data, success, error) {
					$http.put(URLS.BASE_API + '/actas/' + id, data).success(success).error(error)
				},
				eliminar: function (id,  success, error) {
					$http.delete(URLS.BASE_API + '/actas/' + id).success(success).error(error)
				},
	           	insumos: function (success, error) {
	           		$http.get(URLS.BASE_API + '/insumos').success(success).error(error)
	           	}
	       };
	   }
	]);
})();