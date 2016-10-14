(function(){
	'use strict';
    angular.module('RequisicionesUnidadesModule')
    .controller('RequisicionesUnidadCtrl',
    ['$rootScope', '$scope', 'RequisicionesUnidadesDataApi', '$mdSidenav','$location','$http','URLS','$timeout','$mdBottomSheet','Auth','Menu','UsuarioData','$mdMedia','$mdDialog','$document','Mensajero',
    function($rootScope, $scope, RequisicionesUnidadesDataApi,$mdSidenav,$location,$http,URLS,$timeout,$mdBottomSheet,Auth, Menu, UsuarioData,$mdMedia,$mdDialog,$document,Mensajero){
        $scope.menuSelected = $location.path();
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();


        $scope.filtro = {aplicado:false};
        $scope.menuFiltro = {estatus:'todos'};
        $scope.textoBuscado = '';
        $scope.requisicionNueva = undefined;

        $scope.permisoAgregar   =     'BD4D855ECDD33';
        $scope.permisoEliminar  =     'CE8E156BCF5E8';
        $scope.permisoEditar    =     '29DB51365894B';
        $scope.permisoExportar  =     'D2FA533BDCC56';

        $scope.datosDelUsuario = {};
        $scope.cargasIniciales = {catalogos:false, listaRequisiciones:false};
        $scope.parametros = {};
        $scope.cargando = true;
        $scope.cargandoLista = false;
        $scope.smallScreen = !$mdMedia('gt-sm');

        $scope.cargasIniciales.catalogos = true;

        if($scope.cargasIniciales.listaRequisiciones){
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

        $scope.crearRequisicionUnidad = function(){
            if(!$scope.requisicionNueva){
                $scope.ir('requisicionesunidades/nuevo');
            }else{
                $scope.ir('requisicionesunidades/'+$scope.requisicionNueva+'/editar');
            }
        }

        $scope.requisicionesunidadesInfinitas = {
            numLoaded_: 0,
            toLoad_: 0,
            requisiciones: [],
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
                return this.requisiciones[index];
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
                    //parametros.pagina = ((this.requisiciones.length)/50) + 1;
                    if($scope.textoBuscado){
                        parametros.query = $scope.textoBuscado;
                    }

                    RequisicionesUnidadesDataApi.lista(parametros,function (res) {

                        if($scope.requisicionesunidadesInfinitas.maxItems != res.totales){
                            $scope.requisicionesunidadesInfinitas.maxItems = res.totales;
                        }

                        for (var i = 0; i < res.data.length; i++){
                            var obj = {
                                id: res.data[i].id,
                                folio: res.data[i].id+" - "+res.data[i].clues,
                                icono: 'file-outline',
                                //fecha: new Date(res.data[i].created_at + ' 00:00:00'),
                                fecha: res.data[i].created_at,
                                fecha_validacion: res.data[i].fecha_validacion,
                                estatus: res.data[i].estatus,
                                numero_requisiciones: res.data.length,
                                total_requisitado: 0,
                                total_validado: 0
                            };

                            if(res.data[i].estatus == 1){
                                $scope.requisicionNueva = res.data[i].id;
                            }else if(res.data[i].estatus_sincronizacion == 0){
                                obj.icono = 'sync-alert';
                            }else if(res.data[i].estatus == 2){
                                obj.icono = 'file-send';
                            }else if(res.data[i].estatus > 2){
                                obj.icono = 'file-check';
                            }

                            if(res.data[i].fecha_validacion){
                                obj.fecha_validacion = new Date(res.data[i].fecha_validacion);
                            }

                            /*for(var j in res.data[i].requisiciones){
                                var requisicion = res.data[i].requisiciones[j];
                                obj.total_requisitado += parseFloat(requisicion.gran_total);
                                obj.total_validado +=  parseFloat(requisicion.gran_total_validado) || 0;
                            }*/
                            obj.total_requisitado += parseFloat(res.data[i].gran_total);
                            obj.total_validado +=  parseFloat(res.data[i].gran_total_validado) || 0;

                            $scope.requisicionesunidadesInfinitas.requisiciones.push(obj);
                            $scope.requisicionesunidadesInfinitas.numLoaded_++;
                        }
                        $scope.cargandoLista = false;
                        $scope.cargasIniciales.listaActas = true;
                        if($scope.cargasIniciales.catalogos){
                            $scope.cargando = false;
                        }
                    }, function (e, status) {
                        if(status == 403){
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para listar estos elementos.'});
                        }else{
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar listar los elementos.'});
                        }
                        $scope.requisicionesunidadesInfinitas.maxItems = 0;
                        $scope.cargandoLista = false;
                        $scope.cargando = false;
                        console.log(e);
                    });
                }
            }
        };

        var importar = angular.element($document[0].querySelector('input#input-file-id'));
        importar.bind('change', function(e) {

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
                    RequisicionesUnidadesDataApi.importar($scope.informacionArchivo,function(res){
                        $scope.informacionArchivo = null;

                         $scope.requisicionesunidadesInfinitas.numLoaded_ = 0;
                         $scope.requisicionesunidadesInfinitas.toLoad_ = 0;
                         $scope.requisicionesunidadesInfinitas.requisiciones = [];
                         $scope.requisicionesunidadesInfinitas.maxItems = 1;

                        importar.val(null);
                        $scope.cargando = false;
                        console.log(res);
                    },function(e){
                        $scope.cargando = false;
                        importar.val(null);
                        if(e.error_type == 'data_validation'){
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:e.error});
                        }else{
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrio un error al importar el achivo.'});
                        }
                        console.log(e);
                    });
                }
            });
        });

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
            $scope.filtro.estatus = $scope.menuFiltro.estatus;

            if($scope.filtro.estatus != 'todos'){
                $scope.filtro.aplicado = true;
            }else{
                $scope.filtro.aplicado = false;
            }

            $scope.textoBuscado = $scope.textoBusqueda;
            $mdSidenav('busqueda-filtro').close();

            $scope.requisicionesunidadesInfinitas.numLoaded_ = 0;
            $scope.requisicionesunidadesInfinitas.toLoad_ = 0;
            $scope.requisicionesunidadesInfinitas.requisicions = [];
            $scope.requisicionesunidadesInfinitas.maxItems = 1;
        };

        /*$scope.eliminarActa = function(requisicion,ev){
            var confirm = $mdDialog.confirm()
                .title('Eliminar requisicion?')
                .content('¿Esta seguro de eliminar esta requisicion?')
                .targetEvent(ev)
                .ok('Eliminar')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                $scope.cargando = true;
                RequisicionesUnidadesDataApi.eliminar(requisicion.id,function (res){
                    if(requisicion.estatus == 1){
                        $scope.requisicionNueva = undefined;
                    }

                    var index = $scope.requisicionesunidadesInfinitas.requisiciones.indexOf(requisicion);
                    $scope.requisicionesunidadesInfinitas.requisiciones.splice(index,1);
                    $scope.requisicionesunidadesInfinitas.numLoaded_ -= 1;
                    $scope.requisicionesunidadesInfinitas.maxItems -= 1;

                    $scope.cargando = false;
                },function (e, status){
                    if(status == 403){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar eliminar el empleado.'});
                    }
                    $scope.cargando = false;
                    console.log(e);
                });
            }, function() {});
        };*/

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
        .controller('FormUnidadMedicaCtrl',
            ['$rootScope', '$scope', 'RequisicionesUnidadesDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage',
                '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero','$window','ImprimirSolicitud',
                function($rootScope, $scope, RequisicionesUnidadesDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,
                         $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero, $window, ImprimirSolicitud){

                    $scope.menuSelected = "/requisicionesunidades";
                    $scope.menu = Menu.getMenu();
                    $scope.menuIsOpen = false;
                    $scope.loggedUser = UsuarioData.getDatosUsuario();
                    $scope.toggleDatosActa = true;
                    $scope.filtroTipo = 1;
                    $scope.subtotales = {causes:0,no_causes:0,material_curacion:0,controlados:0};

                    $scope.permisoAgregar   =     'BD4D855ECDD33';
                    $scope.permisoEliminar  =     'CE8E156BCF5E8';
                    $scope.permisoEditar    =     '29DB51365894B';
                    $scope.permisoExportar  =     'D2FA533BDCC56';

                    $scope.cargando = true;

                    if($routeParams.id){
                         RequisicionesUnidadesDataApi.ver($routeParams.id,function(res){

                         $scope.requisicion = res.data;
                         $scope.configuracion = res.configuracion;
                         $scope.requisicionunidad = {estatus:1, iva:0.00,total:0.00,subtotal:0.00,requisiciones:{},insumos:[]};

                         $scope.requisicionunidad.ciudad = res.configuracion.clues+" - "+res.configuracion.localidad;
                         $scope.requisicionunidad.clues = res.configuracion.clues;


                         //$scope.requisicionunidad.insumos = res.data.requisiciones;
                         //$scope.requisicionunidad.lugar_reunion = res.configuracion.clues_nombre;

                        //Se necesita configurar
                         if($scope.requisicion.requisiciones[0].created_at){
                            $scope.requisicionunidad.fecha = new Date(res.data.requisiciones[0].created_at );
                         }

                         /*if($scope.requisicion.fecha_validacion){
                            $scope.requisicionunidad.fecha_validacion = new Date(res.data.fecha_validacion);
                         }*/

                         if($scope.requisicion.requisiciones[0].created_at){
                            var horaInicio = $scope.requisicion.requisiciones[0].created_at.substring(11).split(':');
                            $scope.requisicionunidad.hora_inicio_date =  new Date(1970, 0, 1, horaInicio[0], horaInicio[1], 0);
                         }

                         $scope.requisicionunidad.insumos = [];
                         $scope.requisicionunidad.subtotal = 0;
                         $scope.requisicionunidad.total = 0;
                         $scope.requisicionunidad.iva = 0;
                         var requisiciones = {};
                         if(res.data.requisiciones.length){
                             var insumos_guardados = {};
                             for(var i in res.data.requisiciones){
                                 var requisicion = res.data.requisiciones[i];
                                 $scope.requisicionunidad.estatus = requisicion.estatus;
                                 requisiciones[requisicion.tipo_requisicion] = {
                                     id: requisicion.id,
                                     lotes:requisicion.lotes,
                                     //pedido: requisicion.pedido,
                                     tipo_requisicion: requisicion.tipo_requisicion,
                                     dias_surtimiento: requisicion.dias_surtimiento,
                                     sub_total: 0,
                                     gran_total: 0,
                                     iva: 0,
                                     insumos: []
                             }

                             for(var j in requisicion.insumos){
                                 var insumo = {};

                                 insumo.descripcion = requisicion.insumos[j].descripcion;
                                 insumo.clave = requisicion.insumos[j].clave;
                                 insumo.lote = requisicion.insumos[j].lote;
                                 insumo.unidad = requisicion.insumos[j].unidad;
                                 insumo.tipo = requisicion.insumos[j].tipo;
                                 insumo.cause = requisicion.insumos[j].cause;
                                 insumo.controlado = requisicion.insumos[j].controlado;
                                 insumo.precio = requisicion.insumos[j].precio;
                                 //insumo.pedido = requisicion.insumos[j].pedido;

                                 insumo.insumo_id = requisicion.insumos[j].id;

                                 if($scope.requisicion.estatus > 2){
                                 if(requisicion.insumos[j].pivot.cantidad_validada === null){ continue; }
                                    insumo.cantidad = requisicion.insumos[j].pivot.cantidad_validada;
                                    insumo.total = parseFloat(requisicion.insumos[j].pivot.total_validado);
                                 }else{
                                    insumo.cantidad = requisicion.insumos[j].pivot.cantidad;
                                    insumo.total = parseFloat(requisicion.insumos[j].pivot.total);
                                 }

                                 insumo.requisicion_id = requisicion.insumos[j].pivot.requisicion_id;

                                 $scope.requisicionunidad.subtotal += insumo.total;

                                 if(requisicion.tipo_requisicion == 3){
                                    $scope.requisicionunidad.iva += (insumo.total*16/100);
                                    $scope.subtotales.material_curacion += insumo.total
                                 }else if(requisicion.tipo_requisicion == 2){
                                    $scope.subtotales.no_causes += insumo.total
                                 }else if(requisicion.tipo_requisicion == 4){
                                    $scope.subtotales.controlados += insumo.total
                                 }else{
                                    $scope.subtotales.causes += insumo.total
                                 }

                                 if(!insumos_guardados[insumo.insumo_id]){
                                    insumos_guardados[insumo.insumo_id] = true;
                                 }else{
                                    insumo.repetido = true;
                                 }

                                 $scope.requisicionunidad.insumos.push(insumo);
                             }
                             //$scope.requisicion.insumos += requisicion.insumos;
                             }
                         }
                         $scope.subtotales.material_curacion += $scope.requisicionunidad.iva;
                         $scope.requisicionunidad.total = $scope.requisicionunidad.iva + $scope.requisicionunidad.subtotal;

                         res.data.requisiciones = requisiciones;

                         $scope.cargando = false;
                         },function(e){

                         Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                         console.log(e);
                         });
                     }else{
                    $scope.requisicionunidad = {estatus:1, iva:0.00,total:0.00,subtotal:0.00,requisiciones:{},insumos:[]};
                    RequisicionesUnidadesDataApi.cargarConfiguracion($routeParams.id,function(res){
                        $scope.requisicionunidad.ciudad = res.data.clues+" - "+res.data.localidad;
                        $scope.requisicionunidad.clues = res.data.clues;

                        $scope.requisicionunidad.lugar_reunion = res.data.clues_nombre;

                        var fecha_actual = new Date();
                        fecha_actual = new Date(fecha_actual.getFullYear(), fecha_actual.getMonth(), fecha_actual.getDate(), fecha_actual.getHours(), fecha_actual.getMinutes(), 0);

                        $scope.requisicionunidad.fecha = fecha_actual;
                        $scope.requisicionunidad.hora_inicio_date = fecha_actual;
                        $scope.cargando = false;
                    },function(e){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                        console.log(e);
                    });
                    }

                    $scope.agregarInsumo = function(ev){
                        if($scope.requisicionunidad.estatus < 2){
                            $scope.mostrarDialogo(ev);
                        }
                    };
                    $scope.editarInsumo = function(ev,insumo){
                        if($scope.requisicionunidad.estatus < 2){
                            $scope.mostrarDialogo(ev,insumo);
                        }
                    };
                    $scope.eliminarInsumo = function(insumo){
                        //var insumo_local = $scope.requisicionunidad.insumos[index];
                        var insumo_local = insumo;
                        $scope.requisicionunidad.subtotal -= insumo_local.total;
                        if(insumo_local.tipo == 2){
                            var iva = (insumo_local.total*16/100);
                            $scope.requisicionunidad.iva -= iva;
                        }

                        if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 0){
                            $scope.subtotales.causes -= insumo.total;
                        }else if(insumo.tipo == 1 && insumo.cause == 0){
                            $scope.subtotales.no_causes -= insumo.total;
                        }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 1){
                            $scope.subtotales.controlados -= insumo.total;
                        }else{
                            $scope.subtotales.material_curacion -= (insumo.total+(insumo.total*16/100));
                        }

                        var index = $scope.requisicionunidad.insumos.indexOf(insumo);
                        $scope.requisicionunidad.insumos.splice(index,1);
                        $scope.requisicionunidad.total = $scope.requisicionunidad.iva + $scope.requisicionunidad.subtotal;

                    };

                    $scope.cambiaFiltro = function(tipo){
                        var tipo_requisicion = 0;
                        if(tipo == 1){
                            tipo_requisicion = 0;
                        }else if(tipo.tipo == 1 && tipo.cause == 1 && tipo.controlado == 0){
                            tipo_requisicion = 1;
                        }else if(tipo.tipo == 1 && tipo.cause == 0){
                            tipo_requisicion = 2;
                        }else if(tipo.tipo == 2 && tipo.cause == 0){
                            tipo_requisicion = 3;
                        }else if(tipo.tipo == 1 && tipo.cause == 1 && tipo.controlado == 1){
                            tipo_requisicion = 4;
                        }
                        recalcularTotales(tipo_requisicion);
                    };

                    var recalcularTotales = function(tipo){
                        $scope.requisicionunidad.subtotal = 0;
                        $scope.requisicionunidad.iva = 0;
                        $scope.requisicionunidad.total = 0;

                        for(var i in $scope.requisicionunidad.insumos){
                            var insumo = $scope.requisicionunidad.insumos[i];
                            if(tipo === 0){
                                $scope.requisicionunidad.subtotal += insumo.total;
                                if(insumo.tipo == 2 && insumo.cause == 0){
                                    $scope.requisicionunidad.iva += (insumo.total*16/100);
                                }
                            }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 0 && tipo == 1){
                                $scope.requisicionunidad.subtotal += insumo.total;
                            }else if(insumo.tipo == 1 && insumo.cause == 0 && tipo == 2){
                                $scope.requisicionunidad.subtotal += insumo.total;
                            }else if(insumo.tipo == 2 && insumo.cause == 0 && tipo == 3){
                                $scope.requisicionunidad.subtotal += insumo.total;
                                $scope.requisicionunidad.iva += (insumo.total*16/100);
                            }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 1 && tipo == 4){
                                $scope.requisicionunidad.subtotal += insumo.total;
                            }
                        }
                        $scope.requisicionunidad.total = $scope.requisicionunidad.iva + $scope.requisicionunidad.subtotal;
                    };

                    $scope.mostrarDialogo = function(ev,insumo) {
                        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
                        var locals = {
                            insumo: undefined,
                            index: undefined,
                            requisicionunidad: $scope.requisicionunidad,
                            subtotales: $scope.subtotales
                        };
                        if(insumo){
                            locals.insumo = JSON.parse(JSON.stringify(insumo));
                            locals.index = $scope.requisicionunidad.insumos.indexOf(insumo);
                        }

                        $mdDialog.show({
                            //controller: function($scope, $mdDialog, insumo, index) {
                            controller: function($scope, $mdDialog, insumo, index, requisicionunidad, subtotales) {
                                console.log('inicia la aventura.');

                                //$scope.cargando = true;
                                //$scope.catalogo_insumos = [];
                                //var catalogo_insumos = [];
                                /*
                                 RequisicionesUnidadesDataApi.insumos(function(res){
                                 catalogo_insumos = res.data;
                                 $scope.cargando = false;
                                 },function(e){
                                 Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                                 console.log(e);
                                 });*/

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
                                $scope.requisicionunidad = requisicionunidad;
                                $scope.subtotales = subtotales;
                                $scope.insumos_seleccionados = {};

                                for(var i in $scope.requisicionunidad.insumos){
                                    var insumo = $scope.requisicionunidad.insumos[i];
                                    $scope.insumos_seleccionados[insumo.insumo_id] = true;
                                }
                                console.log('     Insumos seleccionados: '+$scope.insumos_seleccionados.length);
                                console.log($scope.insumos_seleccionados);
                                console.log('---------------------------------------------------------------------------');

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
                                    console.log('--answervvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');
                                    //$mdDialog.hide({insumo:$scope.insumo,index:$scope.index});
                                    if($scope.index >= 0){
                                     console.log('     Editando en insumos: '+$scope.insumo.lote);
                                     var insumo_local = $scope.requisicionunidad.insumos[$scope.index];
                                     $scope.requisicionunidad.subtotal -= insumo_local.total;
                                     if(insumo_local.tipo == 2){
                                     var iva = (insumo_local.total*16/100);
                                     $scope.requisicionunidad.iva -= iva;
                                     }

                                     if(insumo_local.insumo_id != $scope.insumo_id){
                                     console.log('          IDs diferentes: '+$scope.insumo.lote);
                                     delete $scope.insumos_seleccionados[insumo_local.insumo_id];
                                     $scope.insumos_seleccionados[$scope.insumo.id] = true;
                                     }

                                     console.log('          Agregando insumo: '+$scope.insumo.lote);
                                     $scope.insumo.editado = true;
                                     $scope.requisicionunidad.insumos[$scope.index] = $scope.insumo;
                                     $scope.requisicionunidad.subtotal += $scope.insumo.total;

                                     //Ajsutar Subtotales
                                     if(insumo_local.tipo == 1 && insumo_local.cause == 1 && insumo_local.controlado == 0){
                                     $scope.subtotales.causes -= insumo_local.total;
                                     $scope.subtotales.causes += $scope.insumo.total;
                                     }else if(insumo_local.tipo == 1 && insumo_local.cause == 0){
                                     $scope.subtotales.no_causes -= insumo_local.total;
                                     $scope.subtotales.no_causes += $scope.insumo.total;
                                     }else if(insumo_local.tipo == 1 && insumo_local.cause == 1 && insumo_local.controlado == 1){
                                     $scope.subtotales.controlados -= insumo_local.total;
                                     $scope.subtotales.controlados += $scope.insumo.total;
                                     }else{
                                     $scope.subtotales.material_curacion -= (insumo_local.total+(insumo_local.total*16/100));
                                     $scope.subtotales.material_curacion += ($scope.insumo.total+($scope.insumo.total*16/100));
                                     }
                                     }else{
                                    console.log('          Agregando a insumos: '+$scope.insumo.lote);
                                    $scope.requisicionunidad.insumos.push($scope.insumo);

                                    console.log('          Sumando subtotal: '+$scope.insumo.total);
                                    $scope.requisicionunidad.subtotal += $scope.insumo.total;
                                    console.log('Agregando a seleccionados: '+$scope.insumo.lote);
                                    $scope.insumos_seleccionados[$scope.insumo.id] = true;

                                    //Ajsutar Subtotales
                                    if($scope.insumo.tipo == 1 && $scope.insumo.cause == 1 && $scope.insumo.controlado == 0){
                                        $scope.subtotales.causes += $scope.insumo.total;
                                    }else if($scope.insumo.tipo == 1 && $scope.insumo.cause == 0){
                                        $scope.subtotales.no_causes += $scope.insumo.total;
                                    }else if($scope.insumo.tipo == 1 && $scope.insumo.cause == 1 && $scope.insumo.controlado == 1){
                                        $scope.subtotales.controlados += $scope.insumo.total;
                                    }else{
                                        $scope.subtotales.material_curacion += ($scope.insumo.total+($scope.insumo.total*16/100));
                                    }
                                    }

                                    if($scope.insumo.tipo == 2){
                                        var iva = ($scope.insumo.total*16/100);
                                        $scope.requisicionunidad.iva += iva;
                                    }

                                    $scope.requisicionunidad.total = $scope.requisicionunidad.iva + $scope.requisicionunidad.subtotal;

                                    $scope.insumoAutoComplete = {};
                                    $scope.insumo = undefined;
                                    $scope.index = undefined;
                                    console.log('     Insumos seleccionados');
                                    console.log($scope.insumos_seleccionados);

                                    document.querySelector('#autocomplete-insumos').focus();
                                    console.log('--answer^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
                                };

                                $scope.calcularTotal = function(){
                                    $scope.insumo.total = $scope.insumo.cantidad * $scope.insumo.precio;
                                };

                                $scope.insumoAutoCompleteItemChange = function(){
                                    $scope.validacion = {};
                                    console.log('--insumoAutoCompleteItemChangevvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');
                                    if ($scope.insumoAutoComplete.insumo != null){
                                        console.log('     checando si existe: '+$scope.insumoAutoComplete.insumo.id)
                                        if($scope.insumos_seleccionados[$scope.insumoAutoComplete.insumo.id]){
                                            console.log('          existe');
                                            $scope.insumo = undefined;
                                            $scope.validacion.insumo = {'duplicate':true};
                                        }else{
                                            console.log('          no existe');
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
                                            $scope.insumo.controlado = $scope.insumoAutoComplete.insumo.controlado;
                                            //$scope.insumo.pedido = $scope.insumoAutoComplete.insumo.pedido;
                                            $scope.insumo.total = 0.00;
                                            //document.querySelector('#input-cantidad').focus();
                                            //document.querySelector('#input-cantidad').trigger('focus');
                                            //$document[0].querySelector('input#input-cantidad').focus();
                                            //document.getElementById("input-cantidad").click();
                                            //angular.element($document[0].querySelector('input#input-cantidad')).focus();
                                        }
                                    }else{
                                        $scope.insumo = undefined;
                                    }
                                    console.log('--insumoAutoCompleteItemChange^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
                                };

                                $scope.querySearchInsumo = function(query) {
                                    return $http.get(URLS.BASE_API + '/insumos',{ params:{ query: query }})
                                        .then(function(res){
                                            var resultados = [];
                                            return res.data.data;
                                        });
                                };


                            },
                            templateUrl: 'src/requisicionesunidades/views/form-insumo.html',
                            parent: angular.element(document.body),
                            targetEvent: ev,
                            clickOutsideToClose:true,
                            fullscreen: useFullScreen,
                            locals:locals
                        })
                            .then(function(res) {}, function() {});
                        $scope.$watch(function() {
                            return $mdMedia('xs') || $mdMedia('sm');
                        }, function(wantsFullScreen) {
                            $scope.customFullscreen = (wantsFullScreen === true);
                        });
                    };

                    /*$scope.finalizarActa = function(ev){
                        var confirm = $mdDialog.confirm()
                            .title('Finalizar captura del requisicion?')
                            .content('La requisicion se cerrará y ya no podrá editarse.')
                            .targetEvent(ev)
                            .ok('Finalizar')
                            .cancel('Cancelar');
                        $mdDialog.show(confirm).then(function() {
                            $scope.requisicion.estatus = 2;
                            $scope.guardar();
                        }, function() {});
                    };*/

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
                        var insumos = $scope.requisicionunidad.insumos;

                        if($scope.requisicionunidad.requisiciones){
                            for(var i in $scope.requisicionunidad.requisiciones){
                                $scope.requisicionunidad.requisiciones[i].sub_total = 0;
                                $scope.requisicionunidad.requisiciones[i].gran_total = 0;
                                $scope.requisicionunidad.requisiciones[i].iva = 0;
                                $scope.requisicionunidad.requisiciones[i].insumos = [];
                            }
                        }

                        for(var i in insumos){
                            if(insumos[i].tipo == 1 && insumos[i].cause == 1 && insumos[i].controlado == 1){
                                var tipo_req = 4; //Medicamentos - causes controlados
                            }else if(insumos[i].tipo == 1 && insumos[i].cause == 1){
                                var tipo_req = 1; //Medicamentos - causes
                            }else if(insumos[i].tipo == 1 && insumos[i].cause == 0){
                                var tipo_req = 2; //Medicamentos - no causes
                            }else{
                                var tipo_req = 3; //Material de curación
                            }
                            if(!$scope.requisicionunidad.requisiciones[tipo_req]){
                                $scope.requisicionunidad.requisiciones[tipo_req] = {
                                    lotes:0,
                                    //pedido: insumos[i].pedido,
                                    tipo_requisicion: tipo_req,
                                    dias_surtimiento: 15,
                                    sub_total: 0,
                                    gran_total: 0,
                                    iva: 0,
                                    insumos: [],
                                    clues: $scope.requisicionunidad.clues,
                                    id: insumos[i].requisicion_id
                                }
                            }
                            $scope.requisicionunidad.requisiciones[tipo_req].sub_total += insumos[i].total;
                            if(tipo_req == 3){
                                $scope.requisicionunidad.requisiciones[tipo_req].iva += (insumos[i].total*16/100);
                            }
                            $scope.requisicionunidad.requisiciones[tipo_req].insumos.push(insumos[i]);
                        }

                        if($scope.requisicionunidad.requisiciones){
                            var borrar_requisiciones = [];
                            for(var i in $scope.requisicionunidad.requisiciones){
                                var requisicion = $scope.requisicionunidad.requisiciones[i];
                                if(requisicion.insumos.length){
                                    requisicion.gran_total = requisicion.iva + requisicion.sub_total;
                                    requisicion.lotes = requisicion.insumos.length;
                                }else{
                                    borrar_requisiciones.push(i);
                                }
                            }
                            for(var i in borrar_requisiciones){
                                delete $scope.requisicionunidad.requisiciones[borrar_requisiciones[i]];
                            }
                        }

                        $scope.requisicionunidad.hora_inicio = $filter('date')($scope.requisicionunidad.hora_inicio_date,'HH:mm:ss');
                        $scope.requisicionunidad.hora_termino = $filter('date')($scope.requisicionunidad.hora_termino_date,'HH:mm:ss');

                        if($routeParams.id){
                            //console.log($scope.requisicionunidad.insumos[0].requisicion_id);
                            console.log($scope.requisicionunidad);
                            RequisicionesUnidadesDataApi.editar($scope.requisicionunidad.insumos[0].requisicion_id, $scope.requisicionunidad ,function (res) {
                                //console.log(res);
                                $scope.cargando = false;
                                var index_insumos_guardados = {};
                                var insumos_guardados = [];
                                var insumos_duplicados = [];

                                for(var i in res.data.requisiciones){
                                    var res_requisicion = res.data.requisiciones[i];

                                    if(!$scope.requisicionunidad.requisiciones[res_requisicion.tipo_requisicion].id){
                                        $scope.requisicionunidad.requisiciones[res_requisicion.tipo_requisicion].id = res_requisicion.id;
                                    }

                                    for(var j in res_requisicion.insumos){
                                        var insumo = res_requisicion.insumos[j];
                                        if(!index_insumos_guardados[insumo.id]){
                                            index_insumos_guardados[insumo.id] = insumos_guardados.length;
                                            insumos_guardados.push(insumo);
                                        }else{
                                            insumo.repetido = true;
                                            insumos_duplicados.push(insumo);
                                        }
                                    }
                                }
                                for(var i in $scope.requisicionunidad.insumos){
                                    var insumo = $scope.requisicionunidad.insumos[i];

                                    if(!insumo.requisicion_id){
                                        var index = index_insumos_guardados[insumo.id];
                                        insumo.requisicion_id = insumos_guardados[index];
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

                                        $scope.requisicionunidad.subtotal += insumo.total;

                                        if(requisicion.tipo_requisicion == 3){
                                            $scope.requisicionunidad.iva += (insumo.total*16/100);
                                            $scope.subtotales.material_curacion += insumo.total;
                                        }else if(requisicion.tipo_requisicion == 2){
                                            $scope.subtotales.no_causes += insumo.total;
                                        }else if(requisicion.tipo_requisicion == 4){
                                            $scope.subtotales.controlados += insumo.total;
                                        }else{
                                            $scope.subtotales.causes += insumo.total;
                                        }
                                        $scope.requisicionunidad.insumos.push(insumo);
                                    }
                                }
                                if(res.data.folio){
                                    $scope.requisicionunidad.folio = res.data.folio;
                                }
                                $scope.requisicionunidad.estatus_sincronizacion = res.data.estatus_sincronizacion;
                                if(!res.respuesta_code){
                                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Alerta',mensaje:'Ocurrió un error al intentar almacenar los datos, por favor intente de nuevo.'});
                                }
                                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Requisicion guardada con éxito.'});
                            }, function (e) {
                                $scope.cargando = false;
                                $scope.validacion = {};
                                if($scope.requisicionunidad.estatus == 2){
                                    $scope.requisicionunidad.estatus = 1;
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
                            //console.log($scope.requisicionunidad);
                            RequisicionesUnidadesDataApi.crear($scope.requisicionunidad,function (res) {
                                $scope.cargando = false;
                                $location.path('requisicionesunidades/'+res.data.id+'/editar');
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
                            .title('Eliminar requisicion?')
                            .content('¿Esta seguro de eliminar esta requisicion?')
                            .targetEvent(ev)
                            .ok('Eliminar')
                            .cancel('Cancelar');

                        $mdDialog.show(confirm).then(function() {
                            $scope.cargando = true;
                            if($scope.requisicionunidad.insumos.length > 0)
                            {
                                RequisicionesUnidadesDataApi.eliminar($scope.requisicionunidad.insumos[0].requisicion_id,function (res){
                                    $scope.cargando = false;
                                    $location.path('requisicionesunidades');
                                },function (e, status){
                                    if(status == 403){
                                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                                    }else{
                                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar eliminar el empleado.'});
                                    }
                                    $scope.cargando = false;
                                    console.log(e);
                                });
                            }else{
                                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Se ha encontrado un error al eliminar el registro, por favor contactese con el administrador del sistema'});
                            }
                        }, function() {});
                    };

                    function numberFormat(numero){
                        // Variable que contendra el resultado final
                        var resultado = "";
                        var decimales = "";
                        // Tomamos el numero eliminando los posibles puntos que tenga
                        var nuevoNumero=numero.replace(/\./g,'');
                        // Si tiene decimales, se los quitamos al numero
                        if(numero.indexOf(".")>=0)
                        {
                            nuevoNumero = nuevoNumero.substring(0,numero.indexOf("."));
                            decimales = "."+numero.substring(numero.length,numero.indexOf(".")+1);
                        }
                        // Ponemos una coma cada 3 caracteres
                        for (var j, i = nuevoNumero.length - 1, j = 0; i >= 0; i--, j++)
                            resultado = nuevoNumero.charAt(i) + ((j > 0) && (j % 3 == 0)? ",": "") + resultado;

                        resultado = resultado + decimales;

                        return resultado;
                    }

                    $scope.exportar = function(tipo){
                        if(tipo){
                            window.open(URLS.BASE_API +'/exportar-csv-unidad/'+$routeParams.id+'?token='+$localStorage.control_desabasto.access_token);
                        }
                    };



                    /*$scope.exportar = function(){
                     window.open(URLS.BASE_API +'/exportar-csv/'+$routeParams.id+'?token='+$localStorage.control_desabasto.access_token);
                     }*/

                    /*$scope.sincronizar = function(){
                        $scope.cargando = true;
                        RequisicionesUnidadesDataApi.sincronizar($scope.requisicionunidad.id,function(res){
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos sincronizados con éxito.'});
                            $scope.requisicionunidad.estatus_sincronizacion = res.data.estatus_sincronizacion;
                            $scope.cargando = false;
                        },function(e){
                            $scope.cargando = false;
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
                    };*/

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
    }]);
})();