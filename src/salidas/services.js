(function(){
	'use strict';
	angular.module('SalidasModule')
	   .factory('SalidasDataApi', ['$http', 'URLS', function ($http, URLS) {
	       return {
				lista: function (params,success, error) {
	               $http.get(URLS.BASE_API + '/salidas',{params:params}).success(success).error(error)
				},
                cargaInsumosActa: function(id, success, error)
                {
                    $http.get(URLS.BASE_API + '/salidas-actas/' + id).success(success).error(error)
                },
                cargaInventario: function(id, success, error)
                {
                   $http.get(URLS.BASE_API + '/salidas-actas-inventario/' + id).success(success).error(error)
                },
				ver: function (id, success, error) {
					$http.get(URLS.BASE_API + '/salidas/' + id).success(success).error(error)
				},
				cargarConfiguracion: function (id, success, error) {
					$http.get(URLS.BASE_API + '/salida-configuracion/' + id).success(success).error(error)
				},
                tiposalida: function (params,success, error) {
                    $http.get(URLS.BASE_API + '/tipo-salidas',{params:params}).success(success).error(error)
                },
				crear: function (data, success, error) {
					$http.post(URLS.BASE_API + '/salidas', data).success(success).error(error)
				},


				editar: function (id, data, success, error) {
					$http.put(URLS.BASE_API + '/salidas/' + id, data).success(success).error(error)
				},
				eliminar: function (id,  success, error) {
					$http.delete(URLS.BASE_API + '/salidas/' + id).success(success).error(error)
				}
	       };
	   }
	]);
})();