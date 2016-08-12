(function(){
	'use strict';
    angular.module('ConfiguracionModule')
    .controller('ConfiguracionCtrl',
    ['$rootScope', '$scope', 'ConfiguracionDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero',
    function(
    $rootScope, $scope, ConfiguracionDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero
    ){
        $scope.menuSelected = "/configuracion";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;

        $scope.cargando = true;

        ConfiguracionDataApi.ver(1,function(res){
            $scope.configuracion = res.data;
            $scope.cargando = false;
        },function(e){
            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
            console.log(e);
        });
        
        $scope.guardar = function() {
            $scope.validacion = {}; 
            $scope.cargando = true;
            ConfiguracionDataApi.editar(1,$scope.configuracion,function (res) {
                $scope.cargando = false;
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Configuración guardada con éxito.'});
            }, function (e) {
                $scope.cargando = false;
                if(e.error_code){
                    if(e.error_code == 'invalid_form'){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Hay un error en los datos del formulario.'});
                    }
                }else{
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                }
                $scope.validacion = {}; 
                var errors = e.error;
                for (var i in errors){
                    var error = JSON.parse('{ "' + errors[i] + '" : true }');
                    $scope.validacion[i] = error;
                }
            });
        };

        $scope.menuCerrado = !UsuarioData.obtenerEstadoMenu();
        if(!$scope.menuCerrado){
          $scope.menuIsOpen = true;
        }

        $scope.toggleMenu  = function(isSm) {
          if(!$scope.menuCerrado && !isSm){
            $mdSidenav('left').close();
            $scope.menuIsOpen = false;
            $scope.menuCerrado = true;
          }else{
            $mdSidenav('left').toggle();
            $scope.menuIsOpen = $mdSidenav('left').isOpen();
          }
          UsuarioData.guardarEstadoMenu($scope.menuIsOpen);
        };
        
        $scope.mostrarIdiomas = function($event){                
            $mdBottomSheet.show({
              templateUrl: './src/app/views/idiomas.html',
              controller: 'ListaIdiomasCtrl',                 
              targetEvent: $event
            });
        };
        
        $scope.logout = function () {
           Auth.logout(function () {
               $location.path("signin");
           });
        };
        
        $scope.ir = function(path){
            $scope.menuSelected = path;
            $location.path(path);
        };
    }])
;
})();