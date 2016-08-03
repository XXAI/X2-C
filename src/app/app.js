(function(){
	'use strict'
	
	var app = angular.module('App', 
								[
									'ngMaterial',
									'ngRoute',
									'ngStorage',
									'ngCookies',
									'ngResource',
									'ngMessages',
									'pascalprecht.translate',
									'http-auth-interceptor',
									'DashboardModule',
									'UsuariosModule',
									'RolesModule']);
	   
	app.config(['$mdThemingProvider','$mdIconProvider','$routeProvider','$httpProvider','$translateProvider','$mdDateLocaleProvider',function($mdThemingProvider,$mdIconProvider,$routeProvider,$httpProvider,$translateProvider,$mdDateLocaleProvider){
		$mdDateLocaleProvider.months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
		$mdDateLocaleProvider.shortMonths = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
		$mdDateLocaleProvider.days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
		$mdDateLocaleProvider.shortDays = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
		// Can change week display to start on Monday.
		$mdDateLocaleProvider.firstDayOfWeek = 0;

		// Configuramos iconos
		$mdIconProvider
	      //.defaultIconSet("assets/svg/avatars.svg", 128)
	      .defaultIconSet('assets/svg/mdi.svg') //materialdesignicons set
		  
		  .icon("logo", "assets/svg/salud_id.svg", 48)
		  .icon("salud-id", "assets/svg/salud_id_white.svg", 48)
		  .icon("ssa", "assets/svg/secretaria_salud.svg", 128)
		  .icon("marca", "assets/svg/chiapas_nos_une.svg", 128)
		  .icon("escudo-chiapas-h", "assets/svg/escudo_chiapas_h.svg", 128)
		  
		  .icon("hearts-filled", "assets/svg/hearts_filled.svg", 128)
		  .icon("diabetes-filled", "assets/svg/diabetes_filled.svg", 128)
		  .icon("coronavirus-filled", "assets/svg/coronavirus_filled.svg", 128)
		  .icon("language", "assets/svg/ic_language_48px.svg", 48)
		  ;
		
		// Configuramos tema de material design
		$mdThemingProvider.theme('default')
	          	.primaryPalette('blue')
	          	.accentPalette('red');
	    $mdThemingProvider.theme('userInfoTheme')
	    		.primaryPalette('teal')
	    		.accentPalette('blue-grey')
	    		.backgroundPalette('blue-grey');
	    $mdThemingProvider.theme('dashboardTheme')
	        	.primaryPalette('deep-orange')
	        	.accentPalette('orange');
	    $mdThemingProvider.theme('altTheme')
	    		.primaryPalette('green')
	    		.accentPalette('light-green');

			  
		// Configuramos las rutas
		
		$routeProvider.when('/',{
			templateUrl: 'src/app/views/inicio.html',
			controller: 'InicioCtrl',
		})
		.when('/que-es',{
			templateUrl: 'src/app/views/que-es.html',
			controller: 'QueEsCtrl',
		})
		.when('/signin',{
			templateUrl: 'src/app/views/signin.html',
			controller: 'SigninCtrl',
		})
		.when('/acceso-denegado',{
			templateUrl: 'src/app/views/forbidden.html',
			controller: 'SimplePageCtrl',
		})
		.when('/no-encontrado',{
			templateUrl: 'src/app/views/not-found.html',
			controller: 'SimplePageCtrl',
		})
		.when('/acerca-de',{
			templateUrl: 'src/app/views/acerca-de.html',
			controller: 'SimplePageCtrl',
		})
		.otherwise({ redirectTo: '/dashboard' });
		
		$httpProvider.interceptors.push(['$q', '$location', '$localStorage', function ($q, $location, $localStorage) {
		   if(angular.isUndefined($localStorage.remedin)){
			   $localStorage.remedin = {}
		   }
		   return {
		       'request': function (config) {
		           config.headers = config.headers || {};
		           if ($localStorage.remedin.access_token) {
		               config.headers.Authorization = 'Bearer ' + $localStorage.remedin.access_token;
		               config.headers['X-Usuario'] = $localStorage.remedin.usuario.id;
		           }
		           return config;
		       },
		       'responseError': function (response) {				 
		           	if (response.status === 401) {
		               	$location.path('signin');
		           	}
		           return $q.reject(response);
		       }
		   };
		}]);
		
		$translateProvider.useStaticFilesLoader({
			prefix:'src/app/i18n/',
			suffix: '.json'
		});
		
		$translateProvider.useLocalStorage();
		$translateProvider.preferredLanguage('es');
		$translateProvider.useSanitizeValueStrategy('escaped');		
	}]);
	
	app.run(['$rootScope','$location','$localStorage','$injector','authService','Menu',function($rootScope,$location, $localStorage, $injector, authService,Menu){

	
			$rootScope.$on('event:auth-loginRequired', function() {
				if($localStorage.remedin.access_token){
					var Auth = $injector.get('Auth');
		      		
						Auth.refreshToken({ access_token: $localStorage.remedin.access_token },
						   function(res){
								$localStorage.remedin.access_token = res.token;
						  		//$localStorage.remedin.refresh_token = res.refresh_token;
								authService.loginConfirmed();
						   }, function (e) {                  
						       
						   		$rootScope.error = "CONNECTION_REFUSED";
								Auth.logout(function () {
						       	$location.path("/");
						   });
						       
						});
				}else{
					// Dejamos que pase la peticion porque ni siquiera hay un access_token
					authService.loginConfirmed();
				}
				
		    });
		
		$rootScope.$on('$routeChangeStart',function(event, next, current){
			if($localStorage.remedin.access_token){
				if(typeof next.$$route !== 'undefined'){					
					var path =  next.$$route.originalPath.split('/');
					// Aquí deberiamos comprobar permisos para acciones de "subrutas"
					
					if(!Menu.existePath("/"+path[1]) && "/"+path[1] != '/acerca-de' && "/"+path[1] != '/acceso-denegado' && "/"+path[1] != '/no-encontrado' ){
						$location.path('/dashboard');
					}					
				}				
			}else{
				if(typeof next.$$route !== 'undefined'){
					if(next.$$route.originalPath != '/signin' && next.$$route.originalPath != '/que-es' && next.$$route.originalPath != '/'){
						$location.path('/');	
					}	
				}else{
					$location.path('/')
				}			
			}
		});
	}]);

})();