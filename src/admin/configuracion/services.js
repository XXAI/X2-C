(function(){
	'use strict';
	angular.module('ConfiguracionModule')
	   .factory('ConfiguracionDataApi', ['$http', 'URLS', function ($http, URLS) {
	       return {
			   ver: function (id, success, error) {
	               $http.get(URLS.BASE_API + '/configuracion/' + id).success(success).error(error)
	           },
			   editar: function (id, data, success, error) {
	               $http.put(URLS.BASE_API + '/configuracion/' + id, data).success(success).error(error)
	           }
	       };
	   }
	]);
})();