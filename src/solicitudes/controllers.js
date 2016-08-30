(function(){
	'use strict';
    angular.module('SolicitudesModule')
    .controller('SolicitudesCtrl',
    ['$rootScope', '$scope', 'SolicitudesDataApi', '$mdSidenav','$location','$http','URLS','$timeout','$mdBottomSheet','Auth','Menu','UsuarioData','$mdMedia','$mdDialog','$document','Mensajero', 
    function($rootScope, $scope, SolicitudesDataApi,$mdSidenav,$location,$http,URLS,$timeout,$mdBottomSheet,Auth, Menu, UsuarioData,$mdMedia,$mdDialog,$document,Mensajero){
        $scope.menuSelected = $location.path();
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();

        $scope.filtro = {aplicado:false};
        $scope.menuFiltro = {estatus:'todos'};
        $scope.textoBuscado = '';

        $scope.permisoAgregar = '44F584F6B56DE';
        $scope.permisoExportar = '77D798C33FC46';
        $scope.permisoEliminar = '1D25DB28AC412';

        $scope.datosDelUsuario = {};
        $scope.cargasIniciales = {catalogos:false, listaSolicitudes:false};
        $scope.parametros = {};
        $scope.cargando = true;
        $scope.cargandoLista = false;
        $scope.smallScreen = !$mdMedia('gt-sm');
        
        $scope.cargasIniciales.catalogos = true;
        if($scope.cargasIniciales.listaSolicitudes){
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

        $scope.solicitudesInfinitas = {
          numLoaded_: 0,
          toLoad_: 0,
          solicitudes: [],
          maxItems:1,
          // Required.
          getItemAtIndex: function(index) {
            if (index >= this.numLoaded_) {
                if(this.numLoaded_ < this.maxItems){
                    this.fetchMoreItems_(index);
                }
                return null;
            }
            return this.solicitudes[index];
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

                var parametros = parametrosFiltro({filtro:filtro});
                parametros.pagina = ((this.solicitudes.length)/50) + 1;
                if($scope.textoBuscado){
                    parametros.query = $scope.textoBuscado;
                }

                SolicitudesDataApi.lista(parametros,function (res) {
                    if($scope.solicitudesInfinitas.maxItems != res.totales){
                        $scope.solicitudesInfinitas.maxItems = res.totales;
                    }
                    
                    for (var i = 0; i < res.data.length; i++){
                        var obj = {
                            id: res.data[i].id,
                            folio: res.data[i].folio,
                            fecha: new Date(res.data[i].fecha + ' 00:00:00'),
                            estatus: res.data[i].estatus,
                            total_importe: res.data[i].total_importe,
                            total_insumos: res.data[i].total_insumos
                        };

                        $scope.solicitudesInfinitas.solicitudes.push(obj);
                        $scope.solicitudesInfinitas.numLoaded_++;
                    }
                    $scope.cargandoLista = false;
                    $scope.cargasIniciales.listaSolicitudes = true;
                    if($scope.cargasIniciales.catalogos){
                        $scope.cargando = false;
                    }
                }, function (e, status) {
                    if(status == 403){
                        Mensajero.mostrarToast({contenedor:'#modulo-solicitudes',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para listar estos elementos.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-solicitudes',titulo:'Error:',mensaje:'Ocurrió un error al intentar listar los elementos.'});
                    }
                    $scope.solicitudesInfinitas.maxItems = 0;
                    $scope.cargandoLista = false;
                    $scope.cargando = false;
                    console.log(e);
                });
            }
          }
        };

        /*var input = angular.element($document[0].querySelector('input#import-file-id'));
        input.bind('change', function(e) {
            $scope.$apply(function() {
                $scope.cargando = true;
                var files = e.target.files;
                if (files[0]) {
                  $scope.informacionArchivo = files[0];
                } else {
                  $scope.informacionArchivo = null;
                  $scope.cargando = false;
                }
                if($scope.informacionArchivo){
                    ActasDataApi.importar($scope.informacionArchivo,function(res){
                        $scope.informacionArchivo = null;

                        $scope.solicitudesInfinitas.numLoaded_ = 0;
                        $scope.solicitudesInfinitas.toLoad_ = 0;
                        $scope.solicitudesInfinitas.solicitudes = [];
                        $scope.solicitudesInfinitas.maxItems = 1;

                        input.val(null);
                        $scope.cargando = false;
                        console.log(res);
                    },function(e){
                        $scope.cargando = false;
                        input.val(null);
                        if(e.error_type == 'data_validation'){
                            Mensajero.mostrarToast({contenedor:'#modulo-solicitudes',titulo:'Error:',mensaje:e.error});
                        }else{
                            Mensajero.mostrarToast({contenedor:'#modulo-solicitudes',titulo:'Error:',mensaje:'Ocurrio un error al importar el achivo.'});
                        }
                        console.log(e);
                    });
                }
            });
        });*/

        /*$scope.importar = function(){
            document.getElementById('import-file-id').click()
        };*/
        
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
            $scope.textoBuscado = $scope.textoBusqueda;
            $mdSidenav('busqueda-filtro').close();
            
            $scope.solicitudesInfinitas.numLoaded_ = 0;
            $scope.solicitudesInfinitas.toLoad_ = 0;
            $scope.solicitudesInfinitas.solicitudes = [];
            $scope.solicitudesInfinitas.maxItems = 1;
        };

        $scope.eliminarSolicitud = function(solicitud,ev){
            var confirm = $mdDialog.confirm()
                .title('Eliminar solicitud?')
                .content('¿Esta seguro de eliminar esta solicitud?')
                .targetEvent(ev)
                .ok('Eliminar')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                $scope.cargando = true;
                SolicitudesDataApi.eliminar(acta.id,function (res){
                    var index = $scope.solicitudesInfinitas.solicitudes.indexOf(acta);
                    $scope.solicitudesInfinitas.solicitudes.splice(index,1);
                    $scope.solicitudesInfinitas.numLoaded_ -= 1;
                    $scope.solicitudesInfinitas.maxItems -= 1;
                    
                    $scope.cargando = false;
                },function (e, status){
                    if(status == 403){
                        Mensajero.mostrarToast({contenedor:'#modulo-solicitudes',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-solicitudes',titulo:'Error:',mensaje:'Ocurrió un error al intentar eliminar el empleado.'});
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
    }])
    .controller('FormSolicitudCtrl',
    ['$rootScope', '$scope', 'SolicitudesDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero',
    function(
    $rootScope, $scope, SolicitudesDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero
    ){
        $scope.menuSelected = "/solicitudes";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.filtroTipo = 1;
        $scope.subtotales = {causes:0,no_causes:0,material_curacion:0};
        
        $scope.permisoAgregar = '44F584F6B56DE';
        $scope.permisoEditar = '439536318C63C';
        $scope.permisoExportar = '77D798C33FC46';
        $scope.permisoEliminar = '1D25DB28AC412';

        $scope.cargando = true;

        if($routeParams.id){
            SolicitudesDataApi.ver($routeParams.id,function(res){
                $scope.solicitud = res.data;

                if($scope.solicitud.insumos.length){
                    var insumos_guardados = {};
                    for(var j in $scope.solicitud.insumos){
                        var raw_insumo = $scope.solicitud.insumos[j];
                        var insumo = {};
                        
                        insumo.descripcion = raw_insumo.descripcion;
                        insumo.clave = raw_insumo.clave;
                        insumo.lote = raw_insumo.lote;
                        insumo.unidad = raw_insumo.unidad;
                        insumo.tipo = raw_insumo.tipo;
                        insumo.cause = raw_insumo.cause;
                        insumo.precio = raw_insumo.precio;
                        insumo.pedido = raw_insumo.pedido;

                        insumo.insumo_id = raw_insumo.id;

                        if($scope.solicitud.estatus > 2){
                            insumo.cantidad = raw_insumo.pivot.cantidad_validada;
                            insumo.total = parseFloat(raw_insumo.pivot.total_validado);
                        }else{
                            insumo.cantidad = raw_insumo.pivot.cantidad;
                            insumo.total = parseFloat(raw_insumo.pivot.total);
                        }
                        
                        insumo.requisicion_id = raw_insumo.pivot.requisicion_id;
                        
                        //$scope.acta.subtotal += insumo.total;

                        if(insumo.tipo == 1 && insumo.cause == 1){
                            $scope.subtotales.causes += insumo.total;
                        }else if(insumo.tipo == 1 && insumo.cause == 0){
                            $scope.subtotales.no_causes += insumo.total;
                        }else{
                            $scope.subtotales.material_curacion += insumo.total;
                        }

                        if(!insumos_guardados[insumo.insumo_id]){
                            insumos_guardados[insumo.insumo_id] = true;
                        }else{
                            insumo.repetido = true;
                        }

                        $scope.solicitud.insumos[j] = insumo;
                        //$scope.acta.insumos.push(insumo);
                    }
                }

                $scope.subtotales.material_curacion += ($scope.subtotales.material_curacion*16/100);

                $scope.cargando = false;
            },function(e){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                console.log(e);
            });
        }else{
            $scope.solicitud = {estatus:1, iva:0.00,gran_total:0.00,sub_total:0.00,insumos:[]};
            $scope.cargando = false;
        }

        $scope.agregarInsumo = function(ev){
            if($scope.solicitud.estatus < 2){
                $scope.mostrarDialogo(ev);
            }
        };
        $scope.editarInsumo = function(ev,index){
            if($scope.solicitud.estatus < 2){
                $scope.mostrarDialogo(ev,index);
            }
        };
        $scope.eliminarInsumo = function(insumo){
            //var insumo_local = $scope.acta.insumos[index];
            var insumo_local = insumo;
            $scope.solicitud.sub_total -= insumo_local.total;
            if(insumo_local.tipo == 2){
                var iva = (insumo_local.total*16/100);
                $scope.solicitud.iva -= iva;
            }

            if(insumo.tipo == 1 && insumo.cause == 1){
                $scope.subtotales.causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 0){
                $scope.subtotales.no_causes -= insumo.total;
            }else{
                $scope.subtotales.material_curacion -= (insumo.total+(insumo.total*16/100));
            }

            var index = $scope.solicitud.insumos.indexOf(insumo);
            $scope.solicitud.insumos.splice(index,1);
            $scope.solicitud.gran_total = $scope.solicitud.iva + $scope.solicitud.sub_total;

        };

        $scope.cambiaFiltro = function(tipo){
            var tipo_requisicion = 0;
            if(tipo == 1){
                tipo_requisicion = 0;
            }else if(tipo.tipo == 1 && tipo.cause == 1){
                tipo_requisicion = 1;
            }else if(tipo.tipo == 1 && tipo.cause == 0){
                tipo_requisicion = 2;
            }else if(tipo.tipo == 2 && tipo.cause == 0){
                tipo_requisicion = 3;
            }
            recalcularTotales(tipo_requisicion);
        };

        var recalcularTotales = function(tipo){
            $scope.solicitud.sub_total = 0;
            $scope.solicitud.iva = 0;
            $scope.solicitud.gran_total = 0;
            
            for(var i in $scope.solicitud.insumos){
                var insumo = $scope.solicitud.insumos[i];
                if(tipo === 0){
                    $scope.solicitud.sub_total += insumo.total;
                    if(insumo.tipo == 2 && insumo.cause == 0){
                        $scope.solicitud.iva += (insumo.total*16/100);
                    }
                }else if(insumo.tipo == 1 && insumo.cause == 1 && tipo == 1){
                    $scope.solicitud.sub_total += insumo.total;
                }else if(insumo.tipo == 1 && insumo.cause == 0 && tipo == 2){
                    $scope.solicitud.sub_total += insumo.total;
                }else if(insumo.tipo == 2 && insumo.cause == 0 && tipo == 3){
                    $scope.solicitud.sub_total += insumo.total;
                    $scope.solicitud.iva += (insumo.total*16/100);
                }
            }
            $scope.solicitud.gran_total = $scope.solicitud.iva + $scope.solicitud.sub_total;
        };
        
        $scope.mostrarDialogo = function(ev,index) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            var locals = {
                insumo: undefined,
                index: undefined,
                solicitud: $scope.solicitud,
                subtotales: $scope.subtotales
            };
            if(index >= 0){
                locals.insumo = JSON.parse(JSON.stringify($scope.acta.insumos[index]));;
                locals.index = index;
            }

            $mdDialog.show({
                //controller: function($scope, $mdDialog, insumo, index) {
                controller: function($scope, $mdDialog, insumo, index, solicitud, subtotales) {
                    //console.log('inicia la aventura.');

                    $scope.cargando = true;
                    $scope.catalogo_insumos = [];

                    SolicitudesDataApi.insumos(function(res){
                        $scope.catalogo_insumos = res.data;
                        $scope.cargando = false;
                    },function(e){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                        //console.log(e);
                    });

                    if(insumo){
                        $scope.insumoAutoComplete = {insumo:insumo, searchText:insumo.clave};
                        $scope.insumo = insumo;
                        $scope.index = index;
                    }else{
                        $scope.insumoAutoComplete = {};
                        $scope.insumo = undefined;
                        $scope.index = undefined;
                    }
                    $scope.validacion = {};
                    $scope.solicitud = solicitud;
                    $scope.subtotales = subtotales;
                    $scope.insumos_seleccionados = {};
                    
                    for(var i in $scope.solicitud.insumos){
                        var insumo = $scope.solicitud.insumos[i];
                        $scope.insumos_seleccionados[insumo.insumo_id] = true;
                    }
                    //console.log('     Insumos seleccionados: '+$scope.insumos_seleccionados.length);
                    //console.log($scope.insumos_seleccionados);
                    //console.log('---------------------------------------------------------------------------');

                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };
                    $scope.answer = function() {
                        if(!$scope.insumo){
                            $scope.validacion.insumo = {'required':true};
                            return false;
                        }

                        if(!$scope.insumo.cantidad){
                            $scope.validacion.cantidad = {'required':true};
                            return false;
                        }
                        //console.log('--answervvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');
                        //$mdDialog.hide({insumo:$scope.insumo,index:$scope.index});
                        if($scope.index >= 0){
                            //console.log('     Editando en insumos: '+$scope.insumo.lote);
                            var insumo_local = $scope.solicitud.insumos[$scope.index];
                            $scope.solicitud.sub_total -= insumo_local.total;
                            if(insumo_local.tipo == 2){
                                var iva = (insumo_local.total*16/100);
                                $scope.solicitud.iva -= iva;
                            }

                            if(insumo_local.insumo_id != $scope.insumo_id){
                                //console.log('          IDs diferentes: '+$scope.insumo.lote);
                                delete $scope.insumos_seleccionados[insumo_local.insumo_id];
                                $scope.insumos_seleccionados[$scope.insumo.id] = true;
                            }

                            //console.log('          Agregando insumo: '+$scope.insumo.lote);
                            $scope.insumo.editado = true;
                            $scope.solicitud.insumos[$scope.index] = $scope.insumo;
                            $scope.solicitud.sub_total += $scope.insumo.total;

                            //Ajsutar Subtotales
                            if(insumo_local.tipo == 1 && insumo_local.cause == 1){
                                $scope.subtotales.causes -= insumo_local.total;
                                $scope.subtotales.causes += $scope.insumo.total;
                            }else if(insumo_local.tipo == 1 && insumo_local.cause == 0){
                                $scope.subtotales.no_causes -= insumo_local.total;
                                $scope.subtotales.no_causes += $scope.insumo.total;
                            }else{
                                $scope.subtotales.material_curacion -= (insumo_local.total+(insumo_local.total*16/100));
                                $scope.subtotales.material_curacion += ($scope.insumo.total+($scope.insumo.total*16/100));
                            }
                        }else{
                            //console.log('          Agregando a insumos: '+$scope.insumo.lote);
                            $scope.solicitud.insumos.push($scope.insumo);

                            //console.log('          Sumando subtotal: '+$scope.insumo.total);
                            $scope.solicitud.sub_total += $scope.insumo.total;
                            //console.log('Agregando a seleccionados: '+$scope.insumo.lote);
                            $scope.insumos_seleccionados[$scope.insumo.id] = true;

                            //Ajsutar Subtotales
                            if($scope.insumo.tipo == 1 && $scope.insumo.cause == 1){
                                $scope.subtotales.causes += $scope.insumo.total;
                            }else if($scope.insumo.tipo == 1 && $scope.insumo.cause == 0){
                                $scope.subtotales.no_causes += $scope.insumo.total;
                            }else{
                                $scope.subtotales.material_curacion += ($scope.insumo.total+($scope.insumo.total*16/100));
                            }
                        }
                        
                        if($scope.insumo.tipo == 2){
                            var iva = ($scope.insumo.total*16/100);
                            $scope.solicitud.iva += iva;
                        }

                        $scope.solicitud.gran_total = $scope.solicitud.iva + $scope.solicitud.sub_total;

                        $scope.insumoAutoComplete = {};
                        $scope.insumo = undefined;
                        $scope.index = undefined;
                        //console.log('     Insumos seleccionados');
                        //console.log($scope.insumos_seleccionados);

                        document.querySelector('#autocomplete-insumos').focus();
                        //console.log('--answer^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
                    };

                    $scope.calcularTotal = function(){
                        $scope.insumo.total = $scope.insumo.cantidad * $scope.insumo.precio;
                    };

                    $scope.insumoAutoCompleteItemChange = function(){
                        $scope.validacion = {};
                        //console.log('--insumoAutoCompleteItemChangevvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');
                        if ($scope.insumoAutoComplete.insumo != null){
                            //console.log('     checando si existe: '+$scope.insumoAutoComplete.insumo.id)
                            if($scope.insumos_seleccionados[$scope.insumoAutoComplete.insumo.id]){
                                //console.log('          existe');
                                $scope.insumo = undefined;
                                $scope.validacion.insumo = {'duplicate':true};
                            }else{
                                //console.log('          no existe');
                                $scope.insumo = {};
                                $scope.insumo.id = $scope.insumoAutoComplete.insumo.id;
                                $scope.insumo.insumo_id = $scope.insumoAutoComplete.insumo.id;
                                $scope.insumo.descripcion = $scope.insumoAutoComplete.insumo.descripcion;
                                $scope.insumo.clave = $scope.insumoAutoComplete.insumo.clave;
                                $scope.insumo.lote = $scope.insumoAutoComplete.insumo.lote;
                                $scope.insumo.unidad = $scope.insumoAutoComplete.insumo.unidad;
                                $scope.insumo.precio = $scope.insumoAutoComplete.insumo.precio;
                                $scope.insumo.tipo = $scope.insumoAutoComplete.insumo.tipo;
                                $scope.insumo.cause = $scope.insumoAutoComplete.insumo.cause;
                                $scope.insumo.pedido = $scope.insumoAutoComplete.insumo.pedido;
                                $scope.insumo.total = 0.00;
                            }
                        }else{
                            $scope.insumo = undefined;
                        }
                        //console.log('--insumoAutoCompleteItemChange^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
                    };

                    /*$scope.querySearchInsumo = function(query) {
                        return $http.get(URLS.BASE_API + '/insumos',{ params:{ query: query }})
                            .then(function(res){
                                var resultados = [];
                                return res.data.data;
                            });
                    };*/

                    $scope.querySearchInsumo = function(query){
                        var results = query ? $scope.catalogo_insumos.filter( createFilterFor(query,['clave','descripcion','lote'])) : $scope.catalogo_insumos;
                        return results;
                    };

                    function createFilterFor(query,searchValues) {
                        var lowercaseQuery = angular.lowercase(query);
                        return function filterFn(item) {
                            for(var i in searchValues){
                                if(angular.lowercase(item[searchValues[i]]+'').indexOf(lowercaseQuery) >= 0){
                                    return true;
                                }
                            }
                            return false;
                        };
                    };
                },
                templateUrl: 'src/solicitudes/views/form-insumo.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: useFullScreen,
                locals:locals
            })
            .then(function(res) {
                /*
                if(res.index >= 0){
                    var insumo_local = $scope.acta.insumos[res.index];
                    $scope.acta.subtotal -= insumo_local.total;
                    $scope.acta.insumos[res.index] = res.insumo;
                    $scope.acta.subtotal += res.insumo.total;
                }else{
                    $scope.acta.insumos.push(res.insumo);
                    $scope.acta.subtotal += res.insumo.total;
                }
                
                if($scope.acta.iva){
                    //
                }else{
                    $scope.acta.total = $scope.acta.subtotal;
                }
                */
            }, function() {
                //console.log('cancelado');
            });
            $scope.$watch(function() {
                return $mdMedia('xs') || $mdMedia('sm');
            }, function(wantsFullScreen) {
                $scope.customFullscreen = (wantsFullScreen === true);
            });
        };

        $scope.finalizarActa = function(ev){
            var confirm = $mdDialog.confirm()
                .title('Finalizar captura de la solicitud?')
                .content('La solicitud se cerrará y ya no podrá editarse.')
                .targetEvent(ev)
                .ok('Finalizar')
                .cancel('Cancelar');
            $mdDialog.show(confirm).then(function() {
                $scope.solicitud.estatus = 2;
                $scope.guardar();
            }, function() {});
        };
        
		function devuelveMes(mes){
            if(mes==0) return 'ENERO';
			else if(mes==1) return 'FEBRERO';
			else if(mes==2) return 'MARZO';
			else if(mes==3) return 'ABRIL';
			else if(mes==4) return 'MAYO';
			else if(mes==5) return 'JUNIO';
			else if(mes==6) return 'JULIO';
			else if(mes==7) return 'AGOSTO';
			else if(mes==8) return 'SEPTIEMBRE';
			else if(mes==9) return 'OCTUBRE';
			else if(mes==10) return 'NOVIEMBRE';
			else return 'DICIEMBRE';			
        }
		
        $scope.guardar = function() {
            $scope.cargando = true;
            var insumos = $scope.solicitud.insumos;

            if($routeParams.id){
                SolicitudesDataApi.editar($scope.solicitud.id,$scope.solicitud,function (res) {
                    $scope.cargando = false;
                    var index_insumos_guardados = {};
                    var insumos_guardados = [];
                    var insumos_duplicados = [];

                    for(var j in res.data.insumos){
                        var insumo = res.data.insumos[j];
                        if(!index_insumos_guardados[insumo.id]){
                            index_insumos_guardados[insumo.id] = insumos_guardados.length;
                            insumos_guardados.push(insumo);
                        }else{
                            insumo.repetido = true;
                            insumos_duplicados.push(insumo);
                        }
                    }

                    for(var i in $scope.solicitud.insumos){
                        var insumo = $scope.solicitud.insumos[i];

                        if(!insumo.requisicion_id){
                            var index = index_insumos_guardados[insumo.id];
                            insumo.requisicion_id = insumos_guardados[index].pivot.requisicion_id;
                            insumo.editado = undefined;
                        }else if(insumo.editado){
                            insumo.editado = undefined;
                        }
                    }

                    if(insumos_duplicados.length){
                        for (var i in insumos_duplicados) {
                            var insumo = insumos_duplicados[i];
                            insumo.insumo_id = insumo.id;
                            insumo.cantidad = insumo.pivot.cantidad;
                            insumo.total = parseFloat(insumo.pivot.total);
                            insumo.requisicion_id = insumo.pivot.requisicion_id;
                            
                            $scope.solicitud.sub_total += insumo.total;

                            if(requisicion.tipo_requisicion == 3){
                                $scope.solicitud.iva += (insumo.total*16/100);
                                $scope.subtotales.material_curacion += insumo.total;
                            }else if(requisicion.tipo_requisicion == 2){
                                $scope.subtotales.no_causes += insumo.total;
                            }else{
                                $scope.subtotales.causes += insumo.total;
                            }
                            $scope.solicitud.insumos.push(insumo);
                        }
                    }

                    if(res.data.folio){
                        $scope.solicitud.folio = res.data.folio;
                    }

                    if(!res.respuesta_code){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Alerta',mensaje:'Ocurrió un error al intentar almacenar los datos, por favor intente de nuevo.'});
                    }

                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Acta guardada con éxito.'});
                }, function (e) {
                    $scope.cargando = false;
                    $scope.validacion = {};
                    if($scope.solicitud.estatus == 2){
                        $scope.solicitud.estatus = 1;
                    }
                    if(e.error_type == 'form_validation'){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Hay un error en los datos del formulario.'});
                        var errors = e.error;
                        for (var i in errors){
                            var error = JSON.parse('{ "' + errors[i] + '" : true }');
                            $scope.validacion[i] = error;
                        }
                    }else if(e.error_type == 'data_validation'){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:e.error});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                    }
                });
            }else{
                SolicitudesDataApi.crear($scope.solicitud,function (res) {
                    $scope.cargando = false;
                    $location.path('solicitudes/'+res.data.id+'/editar');
                }, function (e) {
                    $scope.cargando = false;
                    $scope.validacion = {};
                    if(e.error_type = 'form_validation'){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Hay un error en los datos del formulario.'});
                        $scope.toggleDatosActa = true;
                        var errors = e.error;
                        for (var i in errors){
                            var error = JSON.parse('{ "' + errors[i] + '" : true }');
                            $scope.validacion[i] = error;
                        }
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                    }
                });
            }
        };

        $scope.eliminar = function(ev) {
            var confirm = $mdDialog.confirm()
                .title('Eliminar solicitud?')
                .content('¿Esta seguro de eliminar esta solicitud?')
                .targetEvent(ev)
                .ok('Eliminar')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                $scope.cargando = true;
                SolicitudesDataApi.eliminar($scope.solicitud.id,function (res){
                    $scope.cargando = false;
                    $location.path('solicitudes');
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

        /*$scope.imprimir = function(tipo){
            if(tipo == 'acta'){
                //window.open(URLS.BASE_API +'/acta-pdf/'+$routeParams.id+'?token='+$localStorage.control_desabasto.access_token);
            }else{
                //window.open(URLS.BASE_API +'/requisiciones-pdf/'+$routeParams.id+'?token='+$localStorage.control_desabasto.access_token);
            }
        };*/

        $scope.exportar = function(){
            window.open(URLS.BASE_API +'/exportar-solicitud-csv/'+$routeParams.id+'?token='+$localStorage.control_desabasto.access_token);
        }
        
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