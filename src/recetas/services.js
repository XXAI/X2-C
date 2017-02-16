(function(){
	'use strict';
	angular.module('RecetasModule')
	   	.factory('RecetasDataApi', ['$http', 'URLS', function ($http, URLS) {
	       	return {
                lista: function (params,success, error) {
                    $http.get(URLS.BASE_API + '/recetas',{params:params}).success(success).error(error)
                },
                ver: function (id, success, error) {
                    $http.get(URLS.BASE_API + '/recetas/' + id).success(success).error(error)
                },
                requisiciones: function (success, error) {
					$http.get(URLS.BASE_API + '/requisiciones').success(success).error(error)
	           	},
	           	catalogos: function (success, error) {
					$http.get(URLS.BASE_API + '/requisiciones',{params:{catalogos:true}}).success(success).error(error)
	           	},
			   	guardar: function (data, success, error) {
					$http.post(URLS.BASE_API + '/recetas', data).success(success).error(error)
	           	},
	           	insumos: function (success, error) {
	           		$http.get(URLS.BASE_API + '/insumos').success(success).error(error)
	           	}
	       };
	   }
	]);
})();