(function(){
	'use strict';
    angular.module('RequisicionesModule')
    .controller('RequisicionesCtrl',
    ['$rootScope', '$scope', 'RequisicionesDataApi', '$mdSidenav','$location','$document','$mdBottomSheet','$routeParams','$filter','$localStorage',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero',
    function(
    $rootScope, $scope, RequisicionesDataApi,$mdSidenav,$location,$document,$mdBottomSheet,$routeParams,$filter,$localStorage,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero
    ){
        $scope.menuSelected = "/requisiciones";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;
        $scope.filtroTipo = 1;
        $scope.subtotales = {causes:0,no_causes:0,material_curacion:0};
        $scope.configuracion = {};
        $scope.insumos_estatus = {
            nuevos:{},
            editados:{}
        };

        $scope.elementos =  {
            concentrado:[],
            concentrado_indices:{},
            por_clues:{}
        };
        $scope.clues_seleccionada = undefined;
        $scope.requisiciones = undefined;
        $scope.lista_insumos = $scope.elementos.concentrado;
        $scope.totales = {
            iva:0,
            total:0,
            subtotal:0
        };

        $scope.permisoGuardar = '2438B88CD5ECC';

        $scope.cargando = true;

        RequisicionesDataApi.requisiciones(
            function(res){
                $scope.lista_clues = res.clues;
                $scope.configuracion = res.configuracion;
                if(res.data.length){
                    $scope.requisiciones = {};
                    for(var i in res.data){
                        var requisicion = res.data[i];
                        $scope.requisiciones[requisicion.tipo_requisicion] = {
                            id: requisicion.id,
                            pedido: requisicion.pedido,
                            tipo_requisicion: requisicion.tipo_requisicion,
                            insumos: []
                        };

                        for(var j in requisicion.insumos_clues){
                            var insumo = requisicion.insumos_clues[j];
                            insumo.insumo_id = insumo.id;
                            insumo.requisicion_id = insumo.pivot.requisicion_id;
                            insumo.cantidad = parseInt(insumo.pivot.cantidad);
                            insumo.total = parseFloat(insumo.pivot.total);
                            insumo.clues = insumo.pivot.clues;

                            if(!$scope.elementos.por_clues[insumo.clues]){
                                $scope.elementos.por_clues[insumo.clues] = { insumos: [] };
                            }
                            $scope.elementos.por_clues[insumo.clues].insumos.push(insumo);

                            if($scope.elementos.concentrado_indices[insumo.insumo_id] == undefined){
                                $scope.elementos.concentrado_indices[insumo.insumo_id] = $scope.elementos.concentrado.length;
                                var nuevo_insumo = JSON.parse(JSON.stringify(insumo));
                                nuevo_insumo.total = 0;
                                nuevo_insumo.cantidad = 0;
                                $scope.elementos.concentrado.push(nuevo_insumo);
                            }
                            $scope.elementos.concentrado[$scope.elementos.concentrado_indices[insumo.insumo_id]].cantidad += parseInt(insumo.cantidad);
                            $scope.elementos.concentrado[$scope.elementos.concentrado_indices[insumo.insumo_id]].total += parseFloat(insumo.total);
                        }

                        if(requisicion.tipo_requisicion == 1){
                            $scope.subtotales.causes = requisicion.gran_total;
                        }else if(requisicion.tipo_requisicion == 2){
                            $scope.subtotales.no_causes = requisicion.gran_total;
                        }else{
                            $scope.subtotales.material_curacion = requisicion.gran_total;
                        }
                        $scope.totales.subtotal += parseFloat(requisicion.sub_total);
                        $scope.totales.iva += parseFloat(requisicion.iva);
                    }
                    $scope.totales.total = $scope.totales.subtotal + $scope.totales.iva;
                }
                $scope.cargando = false;
            },function(e){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                console.log(e);
            }
        );
        
        $scope.agregarInsumo = function(ev){
            if($scope.clues_seleccionada){
                $scope.mostrarDialogo(ev);
            }
        };
        $scope.editarInsumo = function(ev,index){
            if($scope.clues_seleccionada){
                $scope.mostrarDialogo(ev,index);
            }
        };
        $scope.eliminarInsumo = function(insumo){
            //var insumo_local = $scope.acta.insumos[index];
            var insumo_local = insumo;
            $scope.totales.subtotal -= insumo_local.total;
            if(insumo_local.tipo == 2){
                var iva = (insumo_local.total*16/100);
                $scope.totales.iva -= iva;
            }

            if(insumo.tipo == 1 && insumo.cause == 1){
                $scope.subtotales.causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 0){
                $scope.subtotales.no_causes -= insumo.total;
            }else{
                $scope.subtotales.material_curacion -= (insumo.total+(insumo.total*16/100));
            }

            var index = $scope.lista_insumos.indexOf(insumo);
            $scope.lista_insumos.splice(index,1);

            var insumo_concentrado = $scope.elementos.concentrado[$scope.elementos.concentrado_indices[insumo.id]];
            insumo_concentrado.cantidad -= insumo.cantidad;
            insumo_concentrado.total -= insumo.total;

            if(insumo_concentrado.cantidad == 0){
                var insumo_concentrado_index = $scope.elementos.concentrado_indices[insumo.id];
                $scope.elementos.concentrado.splice(insumo_concentrado_index,1);
                for(var i in $scope.elementos.concentrado_indices){
                    var index = $scope.elementos.concentrado_indices[i];
                    if(index > insumo_concentrado_index){
                        $scope.elementos.concentrado_indices[i] -= 1;
                    }
                }
                delete $scope.elementos.concentrado_indices[insumo.id];
            }

            $scope.totales.total = $scope.totales.iva + $scope.totales.subtotal;
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
            $scope.totales.subtotal = 0;
            $scope.totales.iva = 0;
            $scope.totales.total = 0;
            
            for(var i in $scope.lista_insumos){
                var insumo = $scope.lista_insumos[i];
                if(tipo === 0){
                    $scope.totales.subtotal += insumo.total;
                    if(insumo.tipo == 2 && insumo.cause == 0){
                        $scope.totales.iva += (insumo.total*16/100);
                    }
                }else if(insumo.tipo == 1 && insumo.cause == 1 && tipo == 1){
                    $scope.totales.subtotal += insumo.total;
                }else if(insumo.tipo == 1 && insumo.cause == 0 && tipo == 2){
                    $scope.totales.subtotal += insumo.total;
                }else if(insumo.tipo == 2 && insumo.cause == 0 && tipo == 3){
                    $scope.totales.subtotal += insumo.total;
                    $scope.totales.iva += (insumo.total*16/100);
                }
            }
            $scope.totales.total = $scope.totales.iva + $scope.totales.subtotal;
        };
        
        $scope.mostrarDialogo = function(ev,index) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            var locals = {
                insumo: undefined,
                index: undefined,
                concentrado: $scope.elementos.concentrado,
                concentrado_indices: $scope.elementos.concentrado_indices,
                lista_insumos: $scope.lista_insumos,
                totales: $scope.totales,
                subtotales: $scope.subtotales,
                insumos_estatus: $scope.insumos_estatus
            };
            if(index >= 0){
                locals.insumo = JSON.parse(JSON.stringify($scope.lista_insumos[index]));
                locals.index = index;
            }

            $mdDialog.show({
                controller: function($scope, $mdDialog, insumo, index, concentrado,concentrado_indices,lista_insumos, totales,subtotales, insumos_estatus) {
                    //console.log('inicia la aventura.');
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
                    $scope.lista_insumos = lista_insumos;
                    $scope.concentrado = concentrado;
                    $scope.concentrado_indices = concentrado_indices;
                    $scope.totales = totales;
                    $scope.subtotales = subtotales;
                    $scope.insumos_estatus = insumos_estatus;
                    $scope.insumos_seleccionados = {};
                    
                    for(var i in $scope.lista_insumos){
                        var insumo = $scope.lista_insumos[i];
                        $scope.insumos_seleccionados[insumo.insumo_id] = true;
                    }

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

                        if($scope.concentrado_indices[$scope.insumo.insumo_id] == undefined){
                            $scope.concentrado_indices[$scope.insumo.insumo_id] = $scope.concentrado.length;
                            var nuevo_insumo = JSON.parse(JSON.stringify($scope.insumo));
                            nuevo_insumo.total = 0;
                            nuevo_insumo.cantidad = 0;
                            $scope.concentrado.push(nuevo_insumo);
                        }
                        
                        if($scope.index >= 0){
                            //console.log('     Editando en insumos: '+$scope.insumo.lote);
                            var insumo_local = $scope.lista_insumos[$scope.index];
                            $scope.totales.subtotal -= insumo_local.total;

                            //ACtualizamos el concentrado de insumos
                            var insumo_concentrado = $scope.concentrado[$scope.concentrado_indices[insumo_local.insumo_id]];
                            insumo_concentrado.cantidad -= insumo_local.cantidad;
                            insumo_concentrado.total -= insumo_local.total;

                            if(insumo_concentrado.cantidad == 0){
                                var insumo_concentrado_index = $scope.concentrado_indices[insumo_local.insumo_id];
                                $scope.concentrado.splice(insumo_concentrado_index,1);
                                for(var i in $scope.concentrado_indices){
                                    var index = $scope.concentrado_indices[i];
                                    if(index > insumo_concentrado_index){
                                        $scope.concentrado_indices[i] -= 1;
                                    }
                                }
                                delete $scope.concentrado_indices[insumo_local.insumo_id];
                            }

                            if(insumo_local.insumo_id != $scope.insumo.insumo_id){
                                delete $scope.insumos_seleccionados[insumo_local.insumo_id];
                                $scope.insumos_seleccionados[$scope.insumo.id] = true;
                                insumo_concentrado = $scope.concentrado[$scope.concentrado_indices[$scope.insumo.insumo_id]];
                            }

                            //ACtualizamos el concentrado de insumos
                            insumo_concentrado.cantidad += $scope.insumo.cantidad;
                            insumo_concentrado.total += $scope.insumo.total;

                            //Lo marcamos como editado, y reemplazamos el objeto en la lista
                            //$scope.insumo.editado = true;
                            $scope.lista_insumos[$scope.index] = $scope.insumo;
                            $scope.insumos_estatus.editados[$scope.insumo.id] = true;

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
                            $scope.lista_insumos.push($scope.insumo);

                            $scope.insumos_estatus.nuevos[$scope.insumo.id] = true;

                            $scope.concentrado[$scope.concentrado_indices[$scope.insumo.insumo_id]].total += $scope.insumo.total;
                            $scope.concentrado[$scope.concentrado_indices[$scope.insumo.insumo_id]].cantidad += $scope.insumo.cantidad;

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

                        $scope.totales.subtotal += $scope.insumo.total;
                        
                        if($scope.insumo.tipo == 2){
                            var iva = ($scope.insumo.total*16/100);
                            $scope.totales.iva += iva;
                        }

                        $scope.totales.total = $scope.totales.iva + $scope.totales.subtotal;

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

                    $scope.querySearchInsumo = function(query) {
                        return $http.get(URLS.BASE_API + '/insumos',{ params:{ query: query }})
                            .then(function(res){
                                var resultados = [];
                                return res.data.data;
                            });
                    };
                },
                templateUrl: 'src/requisiciones/views/form-insumo.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: useFullScreen,
                locals:locals
            })
            .then(function(res) {}, function() {
                //console.log('cancelado');
            });
            $scope.$watch(function() {
                return $mdMedia('xs') || $mdMedia('sm');
            }, function(wantsFullScreen) {
                $scope.customFullscreen = (wantsFullScreen === true);
            });
        };

        $scope.cluesAutoCompleteItemChange = function(){
            if ($scope.cluesAutoComplete.clues != null){
                $scope.clues_seleccionada = $scope.cluesAutoComplete.clues;
                if(!$scope.elementos.por_clues[$scope.clues_seleccionada.clues]){
                    $scope.elementos.por_clues[$scope.clues_seleccionada.clues] = { insumos:[] };
                }
                $scope.lista_insumos = $scope.elementos.por_clues[$scope.clues_seleccionada.clues].insumos
            }else{
                $scope.clues_seleccionada = undefined;
                $scope.lista_insumos = $scope.elementos.concentrado;
            }
            var subtotal = 0;
            var iva = 0;
            for(var i in $scope.lista_insumos){
                subtotal += $scope.lista_insumos[i].total;
                if($scope.lista_insumos[i].tipo == 2){
                    iva += ($scope.lista_insumos[i].total*16/100);
                }
            }
            $scope.totales.subtotal = subtotal;
            $scope.totales.iva = iva;
            $scope.totales.total = iva + subtotal;
        };

        /*$scope.querySearchClues = function(query) {
            return $http.get(URLS.BASE_API + '/clues',{ params:{ query: query }})
                .then(function(res){
                    for(var i in res.data.data){
                        var unidad = res.data.data[i];
                        if($scope.elementos.por_clues[unidad.clues]){
                            res.data.data[i].total_insumos = $scope.elementos.por_clues[unidad.clues].insumos.length;
                        }else{
                            res.data.data[i].total_insumos = 0;
                        }
                    }
                    //if()
                    return res.data.data;
                });
        };*/
        $scope.totalInsumosClues = function(clues){
            if($scope.elementos.por_clues[clues]){
                return $scope.elementos.por_clues[clues].insumos.length;
            }else{
                return 0;
            }
        };
        $scope.querySearchClues = function(query){
            var results = query ? $scope.lista_clues.filter( createFilterFor(query,['clues','nombre'])) : $scope.lista_clues;
            return results;
        };

        function createFilterFor(query,searchValues) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(item) {
                for(var i in searchValues){
                    if(angular.lowercase(item[searchValues[i]]).indexOf(lowercaseQuery) >= 0){
                        return true;
                    }
                }
                return false;
            };
        }

        $scope.crearActa = function(ev){
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            var requisiciones = prepararGuardado();
            var locals = {
                requisiciones: requisiciones,
                configuracion: $scope.configuracion
            };

            $mdDialog.show({
                controller: function($scope, $mdDialog, requisiciones, configuracion) {
                    $scope.requisiciones = requisiciones;
                    $scope.acta = {};
                    $scope.validacion = {};

                    var fecha_actual = new Date();
                    fecha_actual = new Date(fecha_actual.getFullYear(), fecha_actual.getMonth(), fecha_actual.getDate(), fecha_actual.getHours(), fecha_actual.getMinutes(), 0);
                    
                    $scope.acta.fecha = fecha_actual;
                    $scope.acta.hora_inicio_date = fecha_actual;
                    $scope.acta.lugar_reunion = configuracion.clues_nombre;
                    $scope.acta.ciudad = configuracion.localidad;

                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };
                    $scope.guardar = function() {
                        $scope.cargando = true;

                        $scope.acta.hora_inicio = $filter('date')($scope.acta.hora_inicio_date,'HH:mm:ss');
                        $scope.acta.hora_termino = $filter('date')($scope.acta.hora_termino_date,'HH:mm:ss');
                        $scope.acta.estatus = 2;
                        var parametros = {requisiciones: $scope.requisiciones, acta: $scope.acta};

                        RequisicionesDataApi.guardar(parametros,function (res) {
                            $location.path('actas/'+res.acta.id+'/editar');
                        }, function (e) {
                            $scope.cargando = false;
                            $scope.validacion = {};
                            if(e.error_type == 'form_validation'){
                                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Hay un error en los datos del formulario.'});
                                var errors = e.error;
                                for (var i in errors){
                                    var error = JSON.parse('{ "' + errors[i] + '" : true }');
                                    $scope.validacion[i] = error;
                                }
                            }else{
                                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                            }
                        });
                    };
                },
                templateUrl: 'src/requisiciones/views/form-acta.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: useFullScreen,
                locals:locals
            })
            .then(function(res) {}, function() {
                //console.log('cancelado');
            });
        };
        
        function prepararGuardado(){
            var requisiciones = $scope.requisiciones; //hasta tres requisiciones 1, 2 y 3
            var clues_insumos = $scope.elementos.por_clues;

            if(requisiciones){
                for(var i in requisiciones){
                    requisiciones[i].insumos = [];
                }
            }else{
                requisiciones = {};
            }

            for(var clues in clues_insumos){
                var insumos = clues_insumos[clues].insumos;
                for(var i in insumos){
                    if(insumos[i].tipo == 1 && insumos[i].cause == 1){
                        var tipo_req = 1; //Medicamentos - causes
                    }else if(insumos[i].tipo == 1 && insumos[i].cause == 0){
                        var tipo_req = 2; //Medicamentos - no causes
                    }else{
                        var tipo_req = 3; //Material de curación
                    }

                    if(!requisiciones[tipo_req]){
                        requisiciones[tipo_req] = {
                            lotes: 0,
                            pedido: insumos[i].pedido,
                            tipo_requisicion: tipo_req,
                            insumos: []
                        }
                    }
                    
                    insumos[i].clues = clues;

                    requisiciones[tipo_req].insumos.push(insumos[i]);
                }
            }

            if(requisiciones){
                var borrar_requisiciones = [];
                for(var i in requisiciones){
                    var requisicion = requisiciones[i];
                    if(!requisicion.insumos.length){
                        borrar_requisiciones.push(i);
                    }
                }
                for(var i in borrar_requisiciones){
                    delete requisiciones[borrar_requisiciones[i]];
                }
            }
            return requisiciones;
        }

        $scope.guardar = function() {
            $scope.cargando = true;
            
            var requisiciones = prepararGuardado();
            var parametros = {requisiciones: requisiciones};

            RequisicionesDataApi.guardar(parametros,function (res) {
                $scope.cargando = false;
                $scope.insumos_estatus = {
                    nuevos:{},
                    editados:{}
                };
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Requisiciones guardadas.'});
                //console.log(res.data);
                //$location.path('actas/'+res.data.id+'/editar');
            }, function (e) {
                $scope.cargando = false;
                $scope.validacion = {};
                if(e.error_type = 'form_validation'){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Hay un error en los datos del formulario.'});
                    //$scope.toggleDatosActa = true;
                    var errors = e.error;
                    for (var i in errors){
                        var error = JSON.parse('{ "' + errors[i] + '" : true }');
                        $scope.validacion[i] = error;
                    }
                }else if(e.error_type = 'data_validation'){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:e.error});
                }else{
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                }
            });
            /*
            if($routeParams.id){
                RequisicionesDataApi.editar($scope.acta.id,$scope.acta,function (res) {
                    $scope.cargando = false;
                    var index_insumos_guardados = {};
                    var insumos_guardados = [];
                    var insumos_duplicados = [];
                    for(var i in res.data.requisiciones){
                        var res_requisicion = res.data.requisiciones[i];
                        if(!$scope.acta.requisiciones[res_requisicion.tipo_requisicion].id){
                            $scope.acta.requisiciones[res_requisicion.tipo_requisicion].id = res_requisicion.id;
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
                    for(var i in $scope.acta.insumos){
                        var insumo = $scope.acta.insumos[i];

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
                            
                            $scope.acta.subtotal += insumo.total;

                            if(requisicion.tipo_requisicion == 3){
                                $scope.acta.iva += (insumo.total*16/100);
                                $scope.subtotales.material_curacion += insumo.total;
                            }else if(requisicion.tipo_requisicion == 2){
                                $scope.subtotales.no_causes += insumo.total;
                            }else{
                                $scope.subtotales.causes += insumo.total;
                            }
                            $scope.acta.insumos.push(insumo);
                        }
                    }
                    if(res.data.folio){
                        $scope.acta.folio = res.data.folio;
                    }
                    if(!res.respuesta_code){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Alerta',mensaje:'Ocurrió un error al intentar almacenar los datos, por favor intente de nuevo.'});
                    }
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Acta guardada con éxito.'});
                }, function (e) {
                    $scope.cargando = false;
                    $scope.validacion = {};
                    if($scope.acta.estatus == 2){
                        $scope.acta.estatus = 1;
                    }
                    if(e.error_type == 'form_validation'){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Hay un error en los datos del formulario.'});
                        var errors = e.error;
                        for (var i in errors){
                            var error = JSON.parse('{ "' + errors[i] + '" : true }');
                            $scope.validacion[i] = error;
                        }
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                    }
                });
            }else{
            }
            */
        };

        $scope.imprimir = function(){
            window.open(URLS.BASE_API +'/requisiciones-jurisdiccion-pdf?token='+$localStorage.control_desabasto.access_token);
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