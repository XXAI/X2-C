(function(){
	'use strict';
	angular.module('SolicitudesModule')
	   .factory('SolicitudesDataApi', ['$http', 'URLS', function ($http, URLS) {
	       return {
				lista: function (params,success, error) {
	               $http.get(URLS.BASE_API + '/solicitudes',{params:params}).success(success).error(error)
				},
				ver: function (id, success, error) {
					$http.get(URLS.BASE_API + '/solicitudes/' + id).success(success).error(error)
				},
				crear: function (data, success, error) {
					$http.post(URLS.BASE_API + '/solicitudes', data).success(success).error(error)
				},
				editar: function (id, data, success, error) {
					$http.put(URLS.BASE_API + '/solicitudes/' + id, data).success(success).error(error)
				},
				eliminar: function (id,  success, error) {
					$http.delete(URLS.BASE_API + '/solicitudes/' + id).success(success).error(error)
				},
	           	insumos: function (success, error) {
	           		$http.get(URLS.BASE_API + '/insumos').success(success).error(error)
	           	}
	       };
	   }
	]);
})();