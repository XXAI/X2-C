(function(){
	'use strict';
	angular.module('RequisicionesModule')
	   	.factory('RequisicionesDataApi', ['$http', 'URLS', function ($http, URLS) {
	       	return {
	           	requisiciones: function (success, error) {
					$http.get(URLS.BASE_API + '/requisiciones').success(success).error(error)
	           	},
	           	catalogos: function (success, error) {
					$http.get(URLS.BASE_API + '/requisiciones',{params:{catalogos:true}}).success(success).error(error)
	           	},
			   	guardar: function (data, success, error) {
					$http.post(URLS.BASE_API + '/requisiciones', data).success(success).error(error)
	           	},
	           	insumos: function (success, error) {
	           		$http.get(URLS.BASE_API + '/insumos').success(success).error(error)
	           	}
	       };
	   }
	]);
})();