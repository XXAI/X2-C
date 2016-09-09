(function(){
	'use strict';
	angular.module('PedidosModule')
	   .factory('PedidosDataApi', ['$http', 'URLS', function ($http, URLS) {
	       return {
				lista: function (params,success, error) {
	               $http.get(URLS.BASE_API + '/pedidos',{params:params}).success(success).error(error)
				},
				ver: function (id, success, error) {
					$http.get(URLS.BASE_API + '/pedidos/' + id).success(success).error(error)
				},
				cargarConfiguracion: function (id, success, error) {
					$http.get(URLS.BASE_API + '/configuracion/' + id).success(success).error(error)
				},
				recibir: function (data, success, error) {
					$http.post(URLS.BASE_API + '/pedidos', data).success(success).error(error)
				},
				sincronizar: function (id, success, error) {
	               $http.get(URLS.BASE_API + '/sincronizar-validacion/' + id).success(success).error(error)
	           	},
	           	insumos: function (success, error) {
	           		$http.get(URLS.BASE_API + '/insumos').success(success).error(error)
	           	}
	       };
	   }
	]);
})();