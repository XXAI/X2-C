(function(){
	'use strict';	
	angular.module('App')
		.service('AuthService',['$http','URLS',function($http, URLS){
			return {
				autenticar: function(data) {
	                return $http.post(URLS.BASE + '/obtener-token', data, { ignoreAuthModule: true });
	            }
			}
		}]);
	
	angular.module('App')
		.factory('Auth', ['$rootScope', '$http', '$localStorage', 'AuthService', 'URLS','Menu','MENU', function ($rootScope, $http, $localStorage, AuthService, URLS, Menu, MENU) {
			return {
				signin: function (data, successCallback, errorCallback) {
					
					var obtenerToken = function(data)
		                {
							
		                    return AuthService.autenticar(data)                     
		                			.then(function(res){
										//$localStorage.remedin.access_token = res.data.access_token;
               							//$localStorage.remedin.refresh_token = res.data.refresh_token;
               							//$localStorage.remedin.user_email = data.email;
               							if(!res.data.usuario.avatar){
											res.data.usuario.avatar = 'assets/images/avatar-placeholder.png';
										}
               							$localStorage.remedin.access_token = res.data.token;
               							$localStorage.remedin.usuario = res.data.usuario;
		                                return true;
		                            });
		                },/*
						validarAcceso = function(){
							 return AuthService.validar();
						},
						cargarPermisos = function(e){
							return AuthService.getPermisos()
									.then(function(res){
										Menu.setMenu(res.data.permisos);											
									});
						},
						obtenerPerfil = function() {
							return AuthService.getPerfil().then(function(data){
								if(!data.data.data.avatar){
									data.data.data.avatar = 'assets/images/avatar-placeholder.png';
								}
						        $localStorage.remedin.usuario = data.data.data
							});
						},
						*/
						error = function (error) {
							$localStorage.remedin = {};
							var error_code = '';
							
							if(error.data == null){
								error_code = "CONNECTION_REFUSED";
								$rootScope.errorSignin = error_code;
								errorCallback();
								return true;
							}
							
							switch(error.data.error){
								case 'invalid_credentials':
									error_code  = 'ERROR_CREDENCIALES';
									break;
								case 'CUENTA_VALIDA_NO_AUTORIZADA':
									error_code = 'CUENTA_VALIDA_NO_AUTORIZADA';
									break;
								case 'ERROR_PERMISOS':
									error_code = 'ERROR_PERMISOS';
									break;
								default:
									error_code = "CONNECTION_REFUSED";
									break;
							}
							$rootScope.errorSignin = error_code;
							errorCallback();
							
						};
					
					obtenerToken(data)
					//.then(validarAcceso)
					//.then(cargarPermisos)
					//.then(obtenerPerfil)
					.then(successCallback)
					.catch(error);
				},
				refreshToken: function (data, success, error) {
					$http.post(URLS.BASE + '/refresh-token', data).success(success).error(error)
				},
				logout: function (success) {
					$localStorage.remedin = {};
					success();
				}
			};
		}]);
	
	angular.module('App')
		.factory('UsuarioData',['$localStorage','AuthService','filterFilter',function($localStorage, AuthService, filterFilter){
			 return {
				getDatosUsuario: function(){
					return $localStorage.remedin.usuario;	
				},
				tienePermiso: function(clave){
					var resultados = filterFilter($localStorage.remedin.permisos,clave);
					if(clave == resultados[0]){
						return true;
					}else{
						return false;
					}
				},
				obtenerEstadoMenu: function(){
					return $localStorage.remedin.estado_menu;
				},
				guardarEstadoMenu: function(estado){
					$localStorage.remedin.estado_menu = estado;
				}
			 }
		}]);
	angular.module('App').factory('Mensajero',['$mdMedia','$mdToast','$document',function($mdMedia,$mdToast,$document){
		return {
			mostrarToast: function (config){
				if(config){
					var mensaje = config.mensaje || '';
					var titulo = config.titulo || '';
					var contenedor = config.contenedor || 'body';
					var posicion = config.posicion || 'top right';
					var duracion = config.duracion || 3000;

					if($mdMedia('gt-sm')){
	                    $mdToast.show({
	                        template: '<md-toast><strong>'+titulo+'</strong>&nbsp;'+mensaje+'<md-toast>',
	                        parent : $document[0].querySelector(contenedor),
	                        hideDelay: duracion,
	                        position: posicion
	                    });
	                }else{
	                    $mdToast.show(
	                        $mdToast.simple()
	                            .content(titulo + ' ' + mensaje)
	                            .position(posicion)
	                            .parent(contenedor)
	                    );
	                }
				}
			}
		}
	}]);
	angular.module('App').service('Parse',[function(){
        return {
            jsonToHttpArray: function(json) {
                    var jsonParsed = {};
                    for (var i in json){
                        if( typeof json[i] == 'object'){
                            for( var key in json[i]){
                                var tag = i + '[' + key + ']';
                                jsonParsed[tag] = json[i][key];
                            }
                        } else {
                            jsonParsed[i] = json[i];
                        }
                    }
	                return jsonParsed;
	        },
        }        
    }]);
	
	angular.module('App')
		.factory('Menu',['$localStorage','$mdSidenav','MENU',function($localStorage,$mdSidenav, MENU){
			var menuAutorizado = $localStorage.remedin.permisos || [ '' ];
			var menu = [''];
			var menuIsOpen = false;
			function updateMenu(){
				
				// Se clona el array con los elementos del menu
				menu = JSON.parse(JSON.stringify(MENU));
				
				// Recorremos todo el menu y quitamos los elementos a los que no se tenga autorizacion
				for(var i in menu){
					for(var j = 0; j < menu[i].lista.length; j++){
						if(menuAutorizado.indexOf(menu[i].lista[j].key) == -1 ){						
							menu[i].lista.splice(j,1);
							j -= 1;
						}
					}
				}
				
				// Borramos los grupos que no tengan items en su lista			
				for(var i = 0; i < menu.length; i++){
					if(menu[i].lista.length==0){
						menu.splice(i,1);
						i -= 1;
					}
				}
			}
			if($localStorage.remedin.access_token){
				updateMenu();
			}
			
			return {
				menu : menu,
				menuIsOpen: menuIsOpen,
				getMenu:  function(){
					return menu;
				},
				/*checkMenu: function(){
					console.log(this.menuIsOpen);
					if(this.menuIsOpen){
						$mdSidenav('left').open();
						console.log('entro');
					}else{
						console.log('no entro');
					}
				},*/
				setMenu: function(nuevo_menu){
					if(nuevo_menu.length){
						menuAutorizado = nuevo_menu;
					}else{
						menuAutorizado = ['DASHBOARD'];
					}
					//menuAutorizado = nuevo_menu || [ 'DASHBOARD' ];
					$localStorage.remedin.permisos = menuAutorizado;
					updateMenu();
				},
				
				existePath: function(path){
					for(var i in menu){
						for(var j in menu[i].lista){
							if(menu[i].lista[j].path == path){
								return true;
							}
						}
					}
					return false;
				}
			};
		}]);
	
})();