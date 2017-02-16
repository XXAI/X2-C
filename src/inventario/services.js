(function(){
	'use strict';
	angular.module('InventarioModule')
	   	.factory('InventarioDataApi', ['$http', 'URLS', function ($http, URLS) {
	       	return {
	           	requisiciones: function (success, error) {
					$http.get(URLS.BASE_API + '/inventario').success(success).error(error)
	           	},
	           	catalogos: function (success, error) {
					$http.get(URLS.BASE_API + '/inventario',{params:{catalogos:true}}).success(success).error(error)
	           	},
			   	guardar: function (data, success, error) {
					$http.post(URLS.BASE_API + '/inventario', data).success(success).error(error)
	           	},
	           	insumos: function (success, error) {
	           		$http.get(URLS.BASE_API + '/insumos').success(success).error(error)
	           	},
                importar: function (file, success, error,mes,anio) {
                    var fd = new FormData();
                    fd.append('excel', file);
                    fd.append('mes',mes);
                    fd.append('anio',anio);
                    $http.post(URLS.BASE_API + 'importar-excel', fd, {
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    }).success(success).error(error);
                }
	       };
	   }
	]);
})();