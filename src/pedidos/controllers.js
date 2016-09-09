(function(){
	'use strict';
    angular.module('PedidosModule')
    .controller('PedidosCtrl',
    ['$rootScope', '$scope', 'PedidosDataApi', '$mdSidenav','$location','$http','URLS','$timeout','$mdBottomSheet','Auth','Menu','UsuarioData','$mdMedia','$mdDialog','$document','Mensajero', 
    function($rootScope, $scope, PedidosDataApi,$mdSidenav,$location,$http,URLS,$timeout,$mdBottomSheet,Auth, Menu, UsuarioData,$mdMedia,$mdDialog,$document,Mensajero){
        $scope.menuSelected = $location.path();
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();

        $scope.filtro = {aplicado:false};
        $scope.menuFiltro = {estatus:'todos'};
        $scope.textoBuscado = '';

        $scope.permisoRecibir = '2EF18B5F2E2D7';

        $scope.datosDelUsuario = {};
        $scope.cargasIniciales = {catalogos:false, listaPedidos:false};
        $scope.parametros = {};
        $scope.cargando = true;
        $scope.cargandoLista = false;
        $scope.smallScreen = !$mdMedia('gt-sm');

        //$scope.empleados = [];

        $scope.cargasIniciales.catalogos = true;

        if($scope.cargasIniciales.listaPedidos){
            $scope.cargando = false;
        }
        
        function parametrosFiltro(filtro){
            var parametros = {};

            for(var i in filtro){
                var elemento = filtro[i];
                if(typeof elemento === 'object'){
                    for(var j in elemento){
                        parametros[i+'['+j+']'] = elemento[j];
                    }
                }else{
                    parametros[i] = filtro[i];
                }
            }
            return parametros;
        };

        $scope.pedidosInfinitos = {
          numLoaded_: 0,
          toLoad_: 0,
          pedidos: [],
          maxItems:1,
          conErrores:0,
          cluesNoEncontradas:0,
          // Required.
          getItemAtIndex: function(index) {
            if (index >= this.numLoaded_) {
                if(this.numLoaded_ < this.maxItems){
                    this.fetchMoreItems_(index);
                }
                return null;
            }
            return this.pedidos[index];
          },
          // Required.
          // For infinite scroll behavior, we always return a slightly higher
          // number than the previously loaded items.
          getLength: function() {
            if(this.numLoaded_ < this.maxItems){
                return this.numLoaded_ + 1;
            }else{
                return this.numLoaded_;
            }
          },
          fetchMoreItems_: function(index) {
            if(!$scope.cargandoLista){
                $scope.cargandoLista = true;
                
                var filtro = {};

                if($scope.filtro.estatus != 'todos'){
                    filtro.estatus = $scope.filtro.estatus;
                }

                var parametros = parametrosFiltro({filtro:filtro});
                parametros.pagina = ((this.pedidos.length)/50) + 1;
                if($scope.textoBuscado){
                    parametros.query = $scope.textoBuscado;
                }

                PedidosDataApi.lista(parametros,function (res) {
                    if($scope.pedidosInfinitos.maxItems != res.totales){
                        $scope.pedidosInfinitos.maxItems = res.totales;
                    }
                    
                    for (var i = 0; i < res.data.length; i++){
                        var obj = {
                            id: res.data[i].id,
                            folio: res.data[i].folio,
                            icono: 'file-outline',
                            fecha: new Date(res.data[i].fecha + ' 00:00:00'),
                            fecha_pedido: undefined,
                            estatus: res.data[i].estatus,
                            numero_requisiciones: res.data[i].requisiciones.length,
                            total_validado: 0
                        };

                        if(res.data[i].estatus == 1){
                            $scope.actaNueva = res.data[i].id;
                        }else if(res.data[i].estatus_sincronizacion == 0){
                            obj.icono = 'sync-alert';
                        }else if(res.data[i].estatus == 2){
                            obj.icono = 'file-send';
                        }else if(res.data[i].estatus > 2){
                            obj.icono = 'file-check';
                        }

                        if(res.data[i].fecha_pedido){
                            obj.fecha_pedido = new Date(res.data[i].fecha_pedido);
                        }

                        for(var j in res.data[i].requisiciones){
                            var requisicion = res.data[i].requisiciones[j];
                            obj.total_validado +=  parseFloat(requisicion.gran_total_validado) || 0;
                        }
                        
                        $scope.pedidosInfinitos.pedidos.push(obj);
                        $scope.pedidosInfinitos.numLoaded_++;
                    }
                    $scope.cargandoLista = false;
                    $scope.cargasIniciales.listaPedidos = true;
                    if($scope.cargasIniciales.catalogos){
                        $scope.cargando = false;
                    }
                }, function (e, status) {
                    if(status == 403){
                        Mensajero.mostrarToast({contenedor:'#modulo-pedidos',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para listar estos elementos.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-pedidos',titulo:'Error:',mensaje:'Ocurrió un error al intentar listar los elementos.'});
                    }
                    $scope.pedidosInfinitos.maxItems = 0;
                    $scope.cargandoLista = false;
                    $scope.cargando = false;
                    console.log(e);
                });
            }
          }
        };

        $scope.prepararBusqueda = function(){
            $mdSidenav('busqueda-filtro').open();
        };

        $scope.cancelarBusqueda = function(){
            $mdSidenav('busqueda-filtro').close();
        };

        $scope.quitarFiltro = function(){
            $scope.textoBuscado = '';
            $scope.textoBusqueda = '';
            $scope.menuFiltro = {estatus:'todos'};
            $scope.realizarBusqueda();
        };

        $scope.realizarBusqueda = function(){
            $scope.filtro.estatus = $scope.menuFiltro.estatus;

            if($scope.filtro.estatus != 'todos'){
                $scope.filtro.aplicado = true;
            }else{
                $scope.filtro.aplicado = false;
            }

            $scope.textoBuscado = $scope.textoBusqueda;
            $mdSidenav('busqueda-filtro').close();
            
            $scope.pedidosInfinitos.numLoaded_ = 0;
            $scope.pedidosInfinitos.toLoad_ = 0;
            $scope.pedidosInfinitos.pedidos = [];
            $scope.pedidosInfinitos.maxItems = 1;
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
              templateUrl: 'src/app/views/idiomas.html',
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