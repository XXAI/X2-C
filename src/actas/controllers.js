(function(){
	'use strict';
    angular.module('ActasModule')
    .controller('ActasCtrl',
    ['$rootScope', '$scope', 'ActasDataApi', '$mdSidenav','$location','$http','URLS','$timeout','$mdBottomSheet','Auth','Menu','UsuarioData','$mdMedia','$mdDialog','$document','Mensajero', 
    function($rootScope, $scope, ActasDataApi,$mdSidenav,$location,$http,URLS,$timeout,$mdBottomSheet,Auth, Menu, UsuarioData,$mdMedia,$mdDialog,$document,Mensajero){
        $scope.menuSelected = $location.path();
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();

        $scope.filtro = {aplicado:false};
        $scope.menuFiltro = {estatus:'todos'};
        $scope.textoBuscado = '';

        $scope.permisoAgregar = 'B646BDDC8ADB8';
        $scope.permisoEliminar = '47DC5FB9FD13F';

        $scope.datosDelUsuario = {};
        $scope.cargasIniciales = {catalogos:false, listaActas:false};
        $scope.parametros = {};
        $scope.cargando = true;
        $scope.cargandoLista = false;
        $scope.smallScreen = !$mdMedia('gt-sm');

        //$scope.empleados = [];

        $scope.cargasIniciales.catalogos = true;
        if($scope.cargasIniciales.listaActas){
            $scope.cargando = false;
        }
        /*
        var catalogos = {'catalogos[]':['Jurisdiccion','Especialidad','Puesto']};
        ImportarDataApi.cargarCatalogos(catalogos,function (res){
            $scope.jurisdicciones = res.data.Jurisdiccion;

            $scope.especialidades = {};
            for(var i in res.data.Especialidad){
                $scope.especialidades[res.data.Especialidad[i].id] = res.data.Especialidad[i].descripcion;
            }

            $scope.puestos = {};
            for(var i in res.data.Puesto){
                $scope.puestos[res.data.Puesto[i].codigo] = res.data.Puesto[i].descripcion;
            }

            $scope.cargasIniciales.catalogos = true;
            if($scope.cargasIniciales.listaCargas){
                $scope.cargando = false;
            }
        },function (e){
            Mensajero.mostrarToast({contenedor:'#modulo-importar',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos del catalogo.'});
            console.log(e);
        });
        */
        
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

        $scope.actasInfinitas = {
          numLoaded_: 0,
          toLoad_: 0,
          actas: [],
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
            return this.actas[index];
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
                /*if($scope.filtro.duplicados){
                    filtro.duplicados = $scope.filtro.duplicados;
                }
                if($scope.filtro.clues_no_encontradas){
                    filtro.clues_no_encontradas = $scope.filtro.clues_no_encontradas;
                }
                if($scope.filtro.jurisdiccion){
                    filtro.jurisdiccion_clave = $scope.filtro.jurisdiccion.clave;
                }
                if($scope.filtro.estatus != 'todos'){
                    filtro.estatus = $scope.filtro.estatus;
                }*/

                var parametros = parametrosFiltro({filtro:filtro});
                parametros.pagina = ((this.actas.length)/50) + 1;
                if($scope.textoBuscado){
                    parametros.query = $scope.textoBuscado;
                }

                ActasDataApi.lista(parametros,function (res) {
                    if($scope.actasInfinitas.maxItems != res.totales){
                        $scope.actasInfinitas.maxItems = res.totales;
                    }
                    
                    for (var i = 0; i < res.data.length; i++){
                        var obj = {
                            id: res.data[i].id,
                            usuario: res.data[i].usuario,
                            jurisdiccion: res.data[i].jurisdiccion,
                            clues: res.data[i].clues,
                            fecha_de_carga: new Date(res.data[i].created_at),
                            total_registros: res.data[i].total_registros
                        };
                        
                        $scope.actasInfinitas.actas.push(obj);
                        $scope.actasInfinitas.numLoaded_++;
                    }
                    $scope.cargandoLista = false;
                    $scope.cargasIniciales.listaActas = true;
                    if($scope.cargasIniciales.catalogos){
                        $scope.cargando = false;
                    }
                }, function (e, status) {
                    if(status == 403){
                        Mensajero.mostrarToast({contenedor:'#modulo-actas',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para listar estos elementos.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-actas',titulo:'Error:',mensaje:'Ocurrió un error al intentar listar los elementos.'});
                    }
                    $scope.actasInfinitas.maxItems = 0;
                    $scope.cargandoLista = false;
                    $scope.cargando = false;
                    console.log(e);
                });
            }
          }
        };
        
        $scope.prepararBusqueda = function(){
            $mdSidenav('busqueda-filtro').open();
        }

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
            /*
            $scope.filtro.duplicados            = $scope.menuFiltro.duplicados;
            $scope.filtro.clues_no_encontradas  = $scope.menuFiltro.clues_no_encontradas;
            $scope.filtro.jurisdiccion          = $scope.menuFiltro.jurisdiccion;
            $scope.filtro.estatus               = $scope.menuFiltro.estatus;

            if($scope.filtro.duplicados || $scope.filtro.clues_no_encontradas || $scope.filtro.jurisdiccion || $scope.filtro.estatus != 'todos'){
                $scope.filtro.aplicado = true;
            }else{
                $scope.filtro.aplicado = false;
            }
            */
            $scope.textoBuscado = $scope.textoBusqueda;
            $mdSidenav('busqueda-filtro').close();
            
            $scope.actasInfinitas.numLoaded_ = 0;
            $scope.actasInfinitas.toLoad_ = 0;
            $scope.actasInfinitas.actas = [];
            $scope.actasInfinitas.maxItems = 1;
        };

        $scope.eliminarActa = function(carga,ev){
            var confirm = $mdDialog.confirm()
                .title('Eliminar acta?')
                .content('¿Esta seguro de eliminar esta acta?')
                .targetEvent(ev)
                .ok('Eliminar')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                $scope.cargando = true;
                ImportarDataApi.eliminar(carga.id,function (res){
                    var index = $scope.actasInfinitas.actas.indexOf(carga);
                    $scope.actasInfinitas.actas.splice(index,1);
                    $scope.actasInfinitas.numLoaded_ -= 1;
                    $scope.actasInfinitas.maxItems -= 1;
                    
                    $scope.cargando = false;
                },function (e, status){
                    if(status == 403){
                        Mensajero.mostrarToast({contenedor:'#modulo-actas',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-actas',titulo:'Error:',mensaje:'Ocurrió un error al intentar eliminar el empleado.'});
                    }
                    $scope.cargando = false;
                    console.log(e);
                });
            }, function() {});
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
    }]);
})();