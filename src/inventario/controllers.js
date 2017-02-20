(function(){
	'use strict';
    angular.module('InventarioModule')
    .controller('InventarioCtrl',
    ['$rootScope', '$scope', 'InventarioDataApi', '$mdSidenav','$location','$document','$mdBottomSheet','$routeParams','$filter','$localStorage',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero','$timeout','$window',
    function(
    $rootScope, $scope, InventarioDataApi,$mdSidenav,$location,$document,$mdBottomSheet,$routeParams,$filter,$localStorage,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero,$timeout,$window
    ){
        $scope.menuSelected = "/inventario";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;
        $scope.filtroTipo = 1;
        $scope.usuario_id = $scope.loggedUser.id;

       $scope.meses = [];
       $scope.anios= [];
       var meses =[{id:1,nombre:"Enero"},{id:2,nombre:"Febrero"},{id:3,nombre:"Marzo"},{id:4,nombre:"Abril"},{id:5,nombre:"Mayo"},{id:6,nombre:"Junio"},{id:7,nombre:"Julio"},{id:8,nombre:"Agosto"},{id:9,nombre:"Septiembre"},{id:10,nombre:"Octubre"},{id:11,nombre:"Noviembre"},{id:12,nombre:"Diciembre"}];
       var anios=[{id:2016,anio:"2016"},{id:2017,anio:"2017"},{id:2018,anio:"2018"}];
       $scope.meses = meses; 
       $scope.anios=anios;

       $scope.meses_select  = 1;
       $scope.anio_select   = 2017;
        
        $scope.lista_insumos = [];
        
        function carga_lista()
        {
            $scope.lista_insumos = [];
            InventarioDataApi.lista(function(res)
            {
                var contador = 0;
                console.log(res);
                for(var i in res.data){
                    res.data[i][1]; 
                    var obj =
                     {
                         id :               res.data[i].id,
                         clave :            res.data[i].clave,
                         descripcion:       res.data[i].descripcion,
                         valor:             res.data[i].valor,
                         fecha:             res.data[i].created_at
                     }
                     $scope.lista_insumos[obj.id] = obj;
                 }
            },function(e){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                    console.log(e);
                }
            );    
        }
        
        carga_lista();
        
        $scope.generarExcel = function(){
            window.open(URLS.BASE_API +'/inventario-excel?token='+$localStorage.control_desabasto.access_token+"&anio="+$scope.anio_select);
        };

        $scope.permisoGuardar = '2438B88CD5ECC';

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

        /////// importar dato
         var input = angular.element($document[0].querySelector('input#input-file-id'));

        input.bind('change', function(e) {
            $scope.$apply(function() {
                $scope.cargando = true;
                $scope.informacionArchivo = "";

                var files = e.target.files;
                if (files[0]) {
                    $scope.informacionArchivo = files[0];
                } else {
                    $scope.informacionArchivo = null;
                    $scope.cargando = false;
                }

                if($scope.informacionArchivo){
                    InventarioDataApi.importar($scope.informacionArchivo,function(res){
                        $scope.cargando = false;
                        input.val(null);
                        $scope.informacionArchivo = null;
                        
                      Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Exito:',mensaje:'Sincronización exitosa'});
                      carga_lista();
                    },function(e){
                        $scope.cargando = false;
                        input.val(null);

                        if(e.error_type == 'data_validation'){
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:e.error});
                        }else{
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrio un error al importar el achivo.'});
                        }
                        console.log(e);
                    },$scope.meses_select,$scope.anio_select);
                    
                }
            });
        });

        ////////////////////



    }])
;
})();