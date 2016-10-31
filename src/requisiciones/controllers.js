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
        $scope.usuario_id = $scope.loggedUser.id;

        //console.log($localStorage.samm_modulo_requisiciones);
        if(!$localStorage.samm_modulo_requisiciones){
            $localStorage.samm_modulo_requisiciones = {cambios:false};
        }
        
        $scope.modulo = $localStorage.samm_modulo_requisiciones;

        $scope.subtotales = {causes:0,no_causes:0,surfactante_causes:0,surfactante_no_causes:0,material_curacion:0,controlados:0};
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
        //$scope.requisiciones = undefined;
        $scope.totales = {
            iva:0,
            total:0,
            subtotal:0
        };

        $scope.permisoGuardar = '2438B88CD5ECC';

        var cargarRequisiciones = function(){
            RequisicionesDataApi.requisiciones(
                function(res){
                    //console.log(res);
                    $scope.lista_clues = res.clues;
                    $scope.configuracion = res.configuracion;
                    $scope.captura_habilitada = res.captura_habilitada;
                    var cuadro_basico_clues = {};

                    for(var i in $scope.lista_clues){
                        if($scope.lista_clues[i].cuadro_basico.length){
                            var cuadro_basico = {};
                            for(var j in $scope.lista_clues[i].cuadro_basico){
                                var insumo = $scope.lista_clues[i].cuadro_basico[j];
                                cuadro_basico[insumo.llave] = true;
                            }
                            $scope.lista_clues[i].cuadro_basico = cuadro_basico;
                            cuadro_basico_clues[$scope.lista_clues[i].clues] = cuadro_basico;
                        }else{
                            $scope.lista_clues[i].cuadro_basico = undefined;
                        }
                    }

                    if(res.data.length){
                        for(var i in res.data){
                            var insumo = res.data[i];

                            insumo.cantidad = parseInt(insumo.cantidad);
                            insumo.total = parseFloat(insumo.total);
                            insumo.repetido = 0;

                            if(cuadro_basico_clues[insumo.clues]){
                                if(cuadro_basico_clues[insumo.clues][insumo.llave]){
                                    insumo.cuadro_basico = 1;
                                }else{
                                    insumo.cuadro_basico = 0;
                                }
                            }else{
                                insumo.cuadro_basico = 1;
                            }

                            if(!$scope.elementos.por_clues[insumo.clues]){
                                $scope.elementos.por_clues[insumo.clues] = { insumos: [] };
                            }

                            $scope.elementos.por_clues[insumo.clues].insumos.push(insumo);

                            if($scope.elementos.concentrado_indices[insumo.insumo_id] == undefined){
                                $scope.elementos.concentrado_indices[insumo.insumo_id] = $scope.elementos.concentrado.length;
                                var nuevo_insumo = JSON.parse(JSON.stringify(insumo));
                                nuevo_insumo.total = 0;
                                nuevo_insumo.cantidad = 0;
                                nuevo_insumo.cuadro_basico = 1;
                                $scope.elementos.concentrado.push(nuevo_insumo);
                            }

                            /*if(insumo.cuadro_basico){
                                $scope.elementos.concentrado[$scope.elementos.concentrado_indices[insumo.insumo_id]].cuadro_basico += 1;
                            }*/

                            $scope.elementos.concentrado[$scope.elementos.concentrado_indices[insumo.insumo_id]].cantidad += insumo.cantidad;
                            $scope.elementos.concentrado[$scope.elementos.concentrado_indices[insumo.insumo_id]].total += insumo.total;
                            
                            var iva = 0;

                            if(insumo.tipo == 1 && insumo.cause == 1 && insumo.surfactante == 1){
                                $scope.subtotales.surfactante_causes += insumo.total;
                            }else if(insumo.tipo == 1 && insumo.cause == 0 && insumo.surfactante == 1){
                                $scope.subtotales.surfactante_no_causes += insumo.total;
                            }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 0){
                                $scope.subtotales.causes += insumo.total;
                            }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 1){
                                $scope.subtotales.controlados += insumo.total;
                            }else if(insumo.tipo == 1 && insumo.cause == 0){
                                $scope.subtotales.no_causes += insumo.total;
                            }else{
                                iva = (insumo.total*16/100);
                                $scope.subtotales.material_curacion += (insumo.total+iva);
                            }
                            
                            $scope.totales.subtotal += insumo.total;
                            $scope.totales.iva += iva;
                        }

                        $scope.totales.total = $scope.totales.subtotal + $scope.totales.iva;
                    }

                    cuadro_basico_clues = undefined;
                    
                    //Salvar a localStorage
                    $scope.modulo.elementos = $scope.elementos;
                    $scope.modulo.subtotales = $scope.subtotales;
                    $scope.modulo.totales = $scope.totales;
                    $scope.modulo.insumos_estatus = $scope.insumos_estatus;
                    $scope.modulo.lista_clues = $scope.lista_clues;
                    $scope.modulo.configuracion = $scope.configuracion;

                    $scope.cargando = false;
                },function(e){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                    console.log(e);
                }
            );
        };

        $scope.deshacer = function(ev){
            var confirm = $mdDialog.confirm()
                  .title('Deshacer los cambios?')
                  .textContent('Todos los cambios hechos serán eliminados.')
                  .ariaLabel('deshacer')
                  .targetEvent(ev)
                  .ok('Deshacer')
                  .cancel('Cancelar');
            $mdDialog.show(confirm).then(function() {
                $scope.cargando = true;
                $scope.subtotales = {causes:0,no_causes:0,material_curacion:0,surfactante_causes:0,surfactante_no_causes:0};
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
                //$scope.requisiciones = undefined;
                $scope.totales = {
                    iva:0,
                    total:0,
                    subtotal:0
                };
                cargarRequisiciones();
                $scope.modulo.cambios = false;
                //$localStorage.modulo_requisiciones.cambios = false;
                $scope.lista_insumos = $scope.elementos.concentrado;
                $scope.cluesAutoComplete = {};
            }, function() {});
        };

        if($scope.modulo.cambios){
            $scope.cargando = true;
            RequisicionesDataApi.catalogos(
                function(res){

                    for(var i in res.clues){
                        if(res.clues[i].cuadro_basico.length){
                            var cuadro_basico = {};
                            for(var j in res.clues[i].cuadro_basico){
                                var insumo = res.clues[i].cuadro_basico[j];
                                cuadro_basico[insumo.llave] = true;
                            }
                            res.clues[i].cuadro_basico = cuadro_basico;
                        }else{
                            res.clues[i].cuadro_basico = undefined;
                        }
                    }

                    $scope.modulo.lista_clues = res.clues;
                    $scope.modulo.configuracion = res.configuracion;

                    $scope.lista_clues = $scope.modulo.lista_clues;
                    $scope.configuracion = $scope.modulo.configuracion;
                    //$scope.requisiciones = $scope.modulo.requisiciones;
                    $scope.elementos = $scope.modulo.elementos;
                    $scope.subtotales = $scope.modulo.subtotales;
                    $scope.totales = $scope.modulo.totales;
                    $scope.insumos_estatus = $scope.modulo.insumos_estatus;
                    $scope.lista_insumos = $scope.elementos.concentrado;

                    $scope.cargando = false;
                },function(e){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                    console.log(e);
                }
            );
        }else{
            $scope.cargando = true;
            cargarRequisiciones();
        }
        
        $scope.lista_insumos = $scope.elementos.concentrado;
        
        $scope.agregarInsumo = function(ev){
            if($scope.clues_seleccionada){
                $scope.mostrarDialogo(ev);
            }
        };
        $scope.editarInsumo = function(ev,insumo){
            if($scope.clues_seleccionada){
                $scope.mostrarDialogo(ev,insumo);
            }
        };
        $scope.eliminarInsumo = function(insumo){
            //var insumo_local = $scope.acta.insumos[index];
            var insumo_local = insumo;
            //console.log(insumo);
            $scope.totales.subtotal -= insumo_local.total;
            if(insumo_local.tipo == 2){
                var iva = (insumo_local.total*16/100);
                $scope.totales.iva -= iva;
            }

            if(insumo.tipo == 1 && insumo.cause == 1 && insumo.surfactante == 1){
                $scope.subtotales.surfactante_causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 0 && insumo.surfactante == 1){
                $scope.subtotales.surfactante_no_causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 0){
                $scope.subtotales.causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 1){
                $scope.subtotales.controlados -= insumo.total;
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

            if(insumo.repetido){
                insumo_concentrado.repetido -= 1;
                $scope.clues_seleccionada.repetido -= 1;
            }

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

            if(!insumo.repetido){
                $scope.modulo.cambios = true;
            }
            //$localStorage.modulo_requisiciones.cambios = true;
        };

        $scope.cambiaFiltro = function(tipo){
            var tipo_requisicion = 0;
            if(tipo == 1){
                tipo_requisicion = 0;
            }else if(tipo.tipo == 1 && tipo.cause == 1 && tipo.surfactante == 1){
                tipo_requisicion = 5;
            }else if(tipo.tipo == 1 && tipo.cause == 0 && tipo.surfactante == 1){
                tipo_requisicion = 6;
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
                }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.surfactante == 1 && tipo == 5){
                    $scope.totales.subtotal += insumo.total;
                }else if(insumo.tipo == 1 && insumo.cause == 0 && insumo.surfactante == 1 && tipo == 6){
                    $scope.totales.subtotal += insumo.total;
                }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 0 && insumo.surfactante == 0 && tipo == 1){
                    $scope.totales.subtotal += insumo.total;
                }else if(insumo.tipo == 1 && insumo.cause == 0 && tipo == 2&& insumo.surfactante == 0 ){
                    $scope.totales.subtotal += insumo.total;
                }else if(insumo.tipo == 2 && insumo.cause == 0 && tipo == 3){
                    $scope.totales.subtotal += insumo.total;
                    $scope.totales.iva += (insumo.total*16/100);
                }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 1 && insumo.surfactante == 0 && tipo == 4){
                    $scope.totales.subtotal += insumo.total;
                }
            }
            $scope.totales.total = $scope.totales.iva + $scope.totales.subtotal;
        };
        
        $scope.mostrarDialogo = function(ev,insumo) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            var locals = {
                insumo: undefined,
                index: undefined,
                modulo: $scope.modulo,
                clues_seleccionada: $scope.clues_seleccionada,
                lista_insumos: $scope.lista_insumos,
                requisicion_id_unidad: $scope.requisicion_id_unidad,
                RequisicionesDataApi: RequisicionesDataApi
            };
            if(insumo){
                locals.insumo = JSON.parse(JSON.stringify(insumo));
                locals.index = $scope.lista_insumos.indexOf(insumo);
            }

            $mdDialog.show({
                controller: function($scope, $mdDialog, insumo, index, modulo, clues_seleccionada,requisicion_id_unidad, lista_insumos, RequisicionesDataApi) {
                   
                    if(insumo){
                        $scope.insumoAutoComplete = {insumo:insumo, searchText:insumo.clave};
                        $scope.insumo = insumo;
                        $scope.index = index;
                    }else{
                        $scope.insumoAutoComplete = {};
                        $scope.insumo = undefined;
                        $scope.index = undefined;
                    }
                    $scope.modulo = modulo;
                    $scope.validacion = {};
                    $scope.clues_seleccionada = clues_seleccionada;
                    $scope.lista_insumos = lista_insumos;

                    $scope.concentrado          = modulo.elementos.concentrado;
                    $scope.concentrado_indices  = modulo.elementos.concentrado_indices;
                    $scope.totales              = modulo.totales;
                    $scope.subtotales           = modulo.subtotales;
                    $scope.insumos_estatus      = modulo.insumos_estatus;

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

                        $scope.insumo.requisicion_id_unidad = requisicion_id_unidad; // Campo agregado para unidades offline, identificador de requisicion

                        if($scope.concentrado_indices[$scope.insumo.insumo_id] == undefined){
                            $scope.concentrado_indices[$scope.insumo.insumo_id] = $scope.concentrado.length;
                            var nuevo_insumo = JSON.parse(JSON.stringify($scope.insumo));

                            nuevo_insumo.total = 0;
                            nuevo_insumo.cantidad = 0;
                            nuevo_insumo.cuadro_basico = 1;
                            $scope.concentrado.push(nuevo_insumo);
                        }

                        if($scope.index != undefined){
                            var insumo_local = $scope.lista_insumos[$scope.index];

                            //ACtualizamos el concentrado de insumos
                            if(insumo_local.insumo_id == $scope.insumo.insumo_id){
                                var diferencia_cantidad = insumo_local.cantidad - $scope.insumo.cantidad;
                                var diferencia_total = insumo_local.total - $scope.insumo.total;

                                var insumo_concentrado = $scope.concentrado[$scope.concentrado_indices[insumo_local.insumo_id]];
                                insumo_concentrado.cantidad -= diferencia_cantidad; 
                                insumo_concentrado.total -= diferencia_total;

                                if(insumo_concentrado.cantidad == 0){
                                    var insumo_concentrado_index = $scope.concentrado_indices[insumo_concentrado.insumo_id];
                                    $scope.concentrado.splice(insumo_concentrado_index,1);
                                    for(var i in $scope.concentrado_indices){
                                        var index = $scope.concentrado_indices[i];
                                        if(index > insumo_concentrado_index){
                                            $scope.concentrado_indices[i] -= 1;
                                        }
                                    }
                                    delete $scope.concentrado_indices[insumo_concentrado.insumo_id];
                                }

                            }else if(insumo_local.insumo_id != $scope.insumo.insumo_id){

                                delete $scope.insumos_seleccionados[insumo_local.insumo_id];
                                $scope.insumos_seleccionados[$scope.insumo.id] = true;

                                insumo_concentrado = $scope.concentrado[$scope.concentrado_indices[insumo_local.insumo_id]];
                                //ACtualizamos el concentrado de insumos
                                insumo_concentrado.cantidad -= insumo_local.cantidad;
                                insumo_concentrado.total -= insumo_local.total;

                                if(insumo_concentrado.cantidad == 0){
                                    var insumo_concentrado_index = $scope.concentrado_indices[insumo_concentrado.insumo_id];
                                    $scope.concentrado.splice(insumo_concentrado_index,1);
                                    for(var i in $scope.concentrado_indices){
                                        var index = $scope.concentrado_indices[i];
                                        if(index > insumo_concentrado_index){
                                            $scope.concentrado_indices[i] -= 1;
                                        }
                                    }
                                    delete $scope.concentrado_indices[insumo_concentrado.insumo_id];
                                }

                                insumo_concentrado = $scope.concentrado[$scope.concentrado_indices[$scope.insumo.insumo_id]];
                                //ACtualizamos el concentrado de insumos
                                insumo_concentrado.cantidad += $scope.insumo.cantidad;
                                insumo_concentrado.total += $scope.insumo.total;
                            }

                            //Lo marcamos como editado, y reemplazamos el objeto en la lista
                            //$scope.insumo.editado = true;
                            $scope.lista_insumos[$scope.index] = $scope.insumo;
                            $scope.insumos_estatus.editados[$scope.insumo.id] = true;

                            //Ajsutar Subtotales
                            if(insumo_local.tipo == 1 && insumo_local.cause == 1 && insumo_local.surfactante == 1){
                                $scope.subtotales.surfactante_causes -= insumo_local.total;
                                $scope.subtotales.surfactante_causes += $scope.insumo.total;
                            }else if(insumo_local.tipo == 1 && insumo_local.cause == 0 && insumo_local.surfactante == 1){
                                $scope.subtotales.surfactante_no_causes -= insumo_local.total;
                                $scope.subtotales.surfactante_no_causes += $scope.insumo.total;
                            }else if(insumo_local.tipo == 1 && insumo_local.cause == 1 && insumo_local.controlado == 0){
                                $scope.subtotales.causes -= insumo_local.total;
                                $scope.subtotales.causes += $scope.insumo.total;
                            }else if(insumo_local.tipo == 1 && insumo_local.cause == 1 && insumo_local.controlado == 1){
                                $scope.subtotales.controlados -= insumo_local.total;
                                $scope.subtotales.controlados += $scope.insumo.total;
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
                            if($scope.insumo.tipo == 1 && $scope.insumo.cause == 1 && $scope.insumo.surfactante == 1){
                                $scope.subtotales.surfactante_causes += $scope.insumo.total;
                            }else if($scope.insumo.tipo == 1 && $scope.insumo.cause == 0 && $scope.insumo.surfactante == 1){
                                $scope.subtotales.surfactante_no_causes += $scope.insumo.total;
                            }else if($scope.insumo.tipo == 1 && $scope.insumo.cause == 1 && $scope.insumo.controlado == 0){
                                $scope.subtotales.causes += $scope.insumo.total;
                            }else if($scope.insumo.tipo == 1 && $scope.insumo.cause == 1 && $scope.insumo.controlado == 1){
                                $scope.subtotales.controlados += $scope.insumo.total;
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

                        document.querySelector('#autocomplete-insumos').focus();
                        //console.log('--answer^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
                        $scope.modulo.cambios = true;
                        $scope.modulo.cambios = true;

                    };

                    $scope.calcularTotal = function(){
                        $scope.insumo.total = $scope.insumo.cantidad * $scope.insumo.precio;
                    };

                    $scope.reorganizar_indices = function(insumos, clues)
                    {
                        var requisicion_id_unidad  = 0;
                        for(var index in insumos)
                        {
                            if(insumos[index].requisicion_id_unidad && insumos[index].requisicion_id_unidad!=0)
                            {
                                requisicion_id_unidad = insumos[index].requisicion_id_unidad;
                            }
                        }

                        for(var index in insumos)
                        {
                            insumos[index].requisicion_id_unidad = requisicion_id_unidad;

                        }
                        $scope.lista_insumos = insumos;
                        console.log($scope);
                    }

                    $scope.insumoAutoCompleteItemChange = function(){
                        $scope.validacion = {};
                        
                        if ($scope.insumoAutoComplete.insumo != null){
                            
                            if($scope.insumos_seleccionados[$scope.insumoAutoComplete.insumo.id]){
                                $scope.insumo = undefined;
                                $scope.validacion.insumo = {'duplicate':true};
                            }else{
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
                                $scope.insumo.surfactante = $scope.insumoAutoComplete.insumo.surfactante;
                                $scope.insumo.pedido = $scope.insumoAutoComplete.insumo.pedido;
                                $scope.insumo.cuadro_basico = $scope.insumoAutoComplete.insumo.cuadro_basico;
                                $scope.insumo.repetido = 0;
                                $scope.insumo.total = 0.00;
                            }
                        }else{
                            $scope.insumo = undefined;
                        }
                    };
                    
                    $scope.querySearchInsumo = function(query) {
                        return $http.get(URLS.BASE_API + '/insumos',{ params:{ query: query }})
                            .then(function(res){
                                //console.log($scope.clues_seleccionada);
                                var resultados = [];
                                var valor_default = 0;
                                var cuadro_basico = {};

                                if(!$scope.clues_seleccionada.cuadro_basico){
                                    valor_default = 1;
                                }else{
                                    cuadro_basico = $scope.clues_seleccionada.cuadro_basico;
                                }

                                for(var i in res.data.data){
                                    res.data.data[i].cuadro_basico = valor_default;
                                    if(cuadro_basico[res.data.data[i].llave]){
                                        res.data.data[i].cuadro_basico = 1;
                                    }
                                }
                                return res.data.data;
                            });
                    };
                    
                    /*
                    $scope.querySearchInsumo = function(query){
                        var results = query ? $scope.catalogo_insumos.filter( createFilterFor(query,['clave','descripcion','lote'])) : $scope.catalogo_insumos;
                        return results;
                        //return $filter('orderBy')(results, 'total_insumos',true);
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
                    */
                },
                templateUrl: 'src/requisiciones/views/form-insumo.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: useFullScreen,
                locals:locals
            })
            .then(function(res) {
                //$scope.modulo.cambios = true;
                //$localStorage.modulo_requisiciones.cambios = true;
            }, function() {
                //$scope.modulo.cambios = cambios;
                //$localStorage.modulo_requisiciones.cambios = $scope.modulo.cambios;
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
                    $scope.elementos.por_clues[$scope.clues_seleccionada.clues] = { insumos:[], requisicion_acta_id:0 };
                }
                $scope.requisicion_id_unidad = $scope.elementos.por_clues[$scope.clues_seleccionada.clues].requisicion_acta_id;
                if(!$scope.elementos.por_clues[$scope.clues_seleccionada.clues].requisicion_acta_id)
                {
                    $scope.elementos.por_clues[$scope.clues_seleccionada.clues].requisicion_acta_id = 0;
                }
                $scope.lista_insumos = $scope.elementos.por_clues[$scope.clues_seleccionada.clues].insumos;
            }else{
                $scope.requisicion_id_unidad = undefined;
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

        $scope.totalInsumosClues = function(clues){
            if($scope.elementos.por_clues[clues]){
                return $scope.elementos.por_clues[clues].insumos.length;
            }else{
                return 0;
            }
        };

        $scope.querySearchClues = function(query){
            var results = query ? $scope.lista_clues.filter( createFilterFor(query,['clues','nombre'])) : $scope.lista_clues;
            for(var i in results){
                results[i].total_insumos = $scope.totalInsumosClues(results[i].clues);
            }
            return $filter('orderBy')(results, 'total_insumos',true);
        };

        function createFilterFor(query,searchValues) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(item) {
                //for(var i in searchValues){
                    //if(angular.lowercase(item[searchValues[i]]).indexOf(lowercaseQuery) >= 0){
                if(angular.lowercase(item.nombre).indexOf(lowercaseQuery) >= 0 || angular.lowercase(item.clues).indexOf(lowercaseQuery) >= 0){
                    return true;
                }
                //}
                return false;
            };
        };

        $scope.crearActa = function(ev){
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            //var requisiciones = prepararGuardado();
            var insumos = prepararGuardado();
            var locals = {
                //requisiciones: requisiciones,
                insumos: insumos,
                configuracion: $scope.configuracion,
                modulo: $scope.modulo
            };

            $mdDialog.show({
                controller: function($scope, $mdDialog, insumos, configuracion, modulo) {
                    //$scope.requisiciones = requisiciones;
                    $scope.insumos = insumos;
                    $scope.acta = {};
                    $scope.validacion = {};
                    $scope.cargando = false;
                    $scope.modulo = modulo;

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
                        if(!$scope.cargando){
                            $scope.cargando = true;
                            $scope.acta.hora_inicio = $filter('date')($scope.acta.hora_inicio_date,'HH:mm:ss');
                            $scope.acta.hora_termino = $filter('date')($scope.acta.hora_termino_date,'HH:mm:ss');
                            $scope.acta.estatus = 2;
                            //var parametros = {requisiciones: $scope.requisiciones, acta: $scope.acta};
                            var parametros = {insumos: $scope.insumos, acta: $scope.acta};


                            RequisicionesDataApi.guardar(parametros,function (res) {
                                $scope.modulo.cambios = false;
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
                                }else if(e.error_type == 'data_validation'){
                                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:e.error});
                                }else{
                                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                                }
                            });
                        }else{
                            console.log('cargando');
                        }
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
            var clues_insumos = $scope.elementos.por_clues;
            var insumos = [];

            for(var clues in clues_insumos){
                var insumos_en_clues = clues_insumos[clues].insumos;
                for(var i in insumos_en_clues){
                    insumos_en_clues[i].clues = clues;
                    insumos.push(insumos_en_clues[i]);
                }
            }
            return insumos;
        };

        $scope.guardar = function() {
            $scope.cargando = true;

            var insumos = prepararGuardado();
            var parametros = {insumos: insumos};

            console.log(parametros);
            RequisicionesDataApi.guardar(parametros,function (res) {
                $scope.cargando = false;
                $scope.insumos_estatus = {
                    nuevos:{},
                    editados:{}
                };
                $scope.modulo.cambios = false;
                if(res.insumos_repetidos.length === 0){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Requisiciones guardadas.'});
                }else{
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Requisiciones guardadas. Se detectaron insumos repetidos.'});
                    for(var clues in res.insumos_repetidos){
                        for(var unidades in $scope.lista_clues){
                            if($scope.lista_clues[unidades].clues == clues){
                                $scope.lista_clues[unidades].repetido = res.insumos_repetidos[clues].length;
                                break;
                            }
                        }
                        var repetidos = res.insumos_repetidos[clues];
                        for(var insumo_id in repetidos){
                            for(var insumo in $scope.elementos.por_clues[clues].insumos){
                                if($scope.elementos.por_clues[clues].insumos[insumo].insumo_id == repetidos[insumo_id]){
                                    $scope.elementos.por_clues[clues].insumos[insumo].repetido = true;
                                    var index = $scope.elementos.concentrado_indices[repetidos[insumo_id]];
                                    $scope.elementos.concentrado[index].repetido += 1;
                                    break;
                                }
                            }
                        }
                    }
                }
            }, function (e) {
                $scope.cargando = false;
                $scope.validacion = {};
                if(e.error_type == 'form_validation'){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Hay un error en los datos del formulario.'});
                    //$scope.toggleDatosActa = true;
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
        };

        $scope.imprimir = function(){
            window.open(URLS.BASE_API +'/requisiciones-jurisdiccion-pdf?token='+$localStorage.control_desabasto.access_token);
        };

        $scope.importarDatos = function(obj)
        {

            var registros = obj.data.requisiciones;
            var clues = registros[0].clues;

            if($scope.elementos.por_clues[clues] && $scope.elementos.por_clues[clues].insumos.length > 0)
            {
                $scope.showAdvanced = function(ev) {

                    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
                    var locals = {
                        insumo: $scope.insumo,
                        modulo: $scope.modulo,
                        clues : clues,
                        registros: registros,
                        lista_insumos: $scope.lista_insumos
                    };

                    $mdDialog.show({
                        templateUrl: 'src/requisiciones/views/form-confirmacion-importacion.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        scope: $scope,
                        preserveScope: true,
                        clickOutsideToClose:true,
                        fullscreen: useFullScreen,
                        locals:locals,
                        controller: function($scope, $mdDialog, insumo, modulo, clues, registros, lista_insumos) {

                            $scope.cancel = function() {
                                $mdDialog.cancel();
                            };
                            $scope.sustituir = function() {
                                var objetos = [];
                                for(var insumos_iteracion in $scope.elementos.por_clues[clues].insumos){
                                    var indice = $scope.elementos.concentrado_indices[$scope.elementos.por_clues[clues].insumos[insumos_iteracion].insumo_id];

                                    var total_restar    = $scope.elementos.por_clues[clues].insumos[insumos_iteracion].total;
                                    var tipo            = $scope.elementos.por_clues[clues].insumos[insumos_iteracion].tipo;
                                    var cause           = $scope.elementos.por_clues[clues].insumos[insumos_iteracion].cause;
                                    var controlado      = $scope.elementos.por_clues[clues].insumos[insumos_iteracion].controlado;
                                    var surfactante     = $scope.elementos.por_clues[clues].insumos[insumos_iteracion].surfactante;

                                    //Ajsutar Subtotales
                                    if(tipo == 1 && cause == 1 && surfactante == 1){
                                        $scope.subtotales.surfactante_causes -= parseFloat(total_restar);
                                    }else if(tipo == 1 && cause == 0 && surfactante == 1){
                                        $scope.subtotales.surfactante_no_causes -= parseFloat(total_restar);
                                    }else if(tipo == 1 && cause == 1 && controlado == 0 && surfactante == 0){
                                        $scope.subtotales.causes -= parseFloat(total_restar);
                                    }else if(tipo == 1 && cause == 1 && controlado == 1){
                                        $scope.subtotales.controlados -= parseFloat(total_restar);
                                    }else if(tipo == 1 && cause == 0 && surfactante == 0){
                                        $scope.subtotales.no_causes -= parseFloat(total_restar);
                                    }else{
                                        $scope.subtotales.material_curacion -= (total_restar+(total_restar*16/100));
                                    }

                                     $scope.totales.subtotal -= parseFloat(total_restar);

                                     if(tipo == 2){
                                        var iva = (total_restar*16/100);
                                        $scope.totales.iva -= iva;
                                     }
                                    $scope.totales.total = $scope.totales.iva + $scope.totales.subtotal;

                                    if($scope.elementos.concentrado[indice].insumo_id == $scope.elementos.por_clues[clues].insumos[insumos_iteracion].insumo_id)
                                    {
                                        $scope.elementos.concentrado[indice].cantidad = parseInt($scope.elementos.concentrado[indice].cantidad) - parseInt($scope.elementos.por_clues[clues].insumos[insumos_iteracion].cantidad);
                                        $scope.elementos.concentrado[indice].total = parseFloat($scope.elementos.concentrado[indice].total) - parseFloat($scope.elementos.por_clues[clues].insumos[insumos_iteracion].total);
                                    }
                                }
                                $scope.elementos.por_clues[clues].insumos = [];
                                var array_concentrado   = [];
                                var array_indices       = {};
                                var contador            = 0;
                                for(var indice_concentrado in $scope.elementos.concentrado){
                                    if($scope.elementos.concentrado[indice_concentrado].cantidad > 0)
                                    {
                                        array_concentrado.push($scope.elementos.concentrado[indice_concentrado]);
                                        array_indices[$scope.elementos.concentrado[indice_concentrado].insumo_id] = array_concentrado.length;
                                        contador++;
                                    }
                                }
                                $scope.elementos.concentrado_indices = array_indices;
                                $scope.elementos.concentrado          = array_concentrado;
                                $scope.lista_insumos                  = array_concentrado;
                                ingresa_insumos(registros);
                                $mdDialog.cancel();
                            }
                            $scope.agregar_solicitud = function() {

                                var agregar_iteracion_tipo = 0;
                                var solicitud_nueva = {};
                                var insumos = Array();
                                var arreglo = [{clues : registros[0].clues , insumos : [], acta_id: 0 }];
                                var requisicion_id_unidad = 0;

                                for(agregar_iteracion_tipo in registros)
                                {

                                    var clues = registros[agregar_iteracion_tipo].clues;
                                    var agregar_iteracion_insumos = 0;
                                    requisicion_id_unidad = registros[agregar_iteracion_tipo].acta_id;
                                    $scope.elementos.por_clues[registros[agregar_iteracion_tipo].clues].requisicion_acta_id = registros[agregar_iteracion_tipo].acta_id;

                                    for(agregar_iteracion_insumos in registros[agregar_iteracion_tipo].insumos)
                                    {
                                        var agregar_iteracion_clues = 0;
                                        var bandera = 0;
                                        for(agregar_iteracion_clues in $scope.elementos.por_clues[clues].insumos)
                                        {
                                            if($scope.elementos.por_clues[clues].insumos[agregar_iteracion_clues].insumo_id == registros[agregar_iteracion_tipo].insumos[agregar_iteracion_insumos].pivot.insumo_id)
                                            {

                                                var requisiciones = registros[agregar_iteracion_tipo].insumos[agregar_iteracion_insumos];
                                                var indice = $scope.elementos.concentrado_indices[$scope.elementos.por_clues[clues].insumos[agregar_iteracion_clues].insumo_id];
                                                $scope.elementos.concentrado[indice].cantidad += parseInt(registros[agregar_iteracion_tipo].insumos[agregar_iteracion_insumos].pivot.cantidad);
                                                $scope.elementos.concentrado[indice].total += parseFloat(registros[agregar_iteracion_tipo].insumos[agregar_iteracion_insumos].pivot.total);

                                                $scope.elementos.por_clues[clues].insumos[agregar_iteracion_clues].cantidad += parseInt(registros[agregar_iteracion_tipo].insumos[agregar_iteracion_insumos].pivot.cantidad);
                                                $scope.elementos.por_clues[clues].insumos[agregar_iteracion_clues].total += parseFloat(registros[agregar_iteracion_tipo].insumos[agregar_iteracion_insumos].pivot.total);
                                                $scope.elementos.por_clues[clues].insumos[agregar_iteracion_clues].requisicion_id_unidad = registros[agregar_iteracion_tipo].acta_id;

                                                if(requisiciones.tipo == 1 && requisiciones.cause == 1 && requisiciones.surfactante == 1){
                                                    $scope.subtotales.surfactante_causes += parseFloat(requisiciones.pivot.total);
                                                }else if(requisiciones.tipo == 1 && requisiciones.cause == 0 && requisiciones.surfactante == 1){
                                                    $scope.subtotales.surfactante_no_causes += parseFloat(requisiciones.pivot.total);
                                                }else if(requisiciones.tipo == 1 && requisiciones.cause == 1 && requisiciones.controlado == 0 && requisiciones.surfactante == 0){
                                                    $scope.subtotales.causes += parseFloat(requisiciones.pivot.total);
                                                }else if(requisiciones.tipo == 1 && requisiciones.cause == 1 && requisiciones.controlado == 1){
                                                    $scope.subtotales.controlados += parseFloat(requisiciones.pivot.total);
                                                }else if(requisiciones.tipo == 1 && requisiciones.cause == 0 && requisiciones.surfactante == 0){
                                                    $scope.subtotales.no_causes += parseFloat(requisiciones.pivot.total);
                                                }else{
                                                    $scope.subtotales.material_curacion += (parseFloat(requisiciones.pivot.total)+ (parseFloat(requisiciones.pivot.total)*16/100));
                                                }

                                                $scope.totales.subtotal += parseFloat(requisiciones.pivot.total);

                                                if(requisiciones.tipo == 2){
                                                    var iva = (requisiciones.pivot.total*16/100);
                                                    $scope.totales.iva += iva;
                                                }

                                                $scope.totales.total = parseFloat($scope.totales.iva) + parseFloat($scope.totales.subtotal);
                                                bandera = 1;
                                            }
                                        }

                                        if(bandera == 0)
                                        {
                                            insumos[insumos.length] = registros[agregar_iteracion_tipo].insumos[agregar_iteracion_insumos];
                                        }
                                    }
                                }
                                arreglo[0].insumos = insumos;
                                arreglo[0].acta_id = requisicion_id_unidad;
                                ingresa_insumos(arreglo);
                                $mdDialog.cancel();
                            }
                        }
                    });
                };
                $scope.showAdvanced();
            }else{
                ingresa_insumos(registros);

            }
        }

        function ingresa_insumos(registros)
        {
            var clues = "";
            var id_acta_unidad = 0;
            for(var requisiciones in registros){

                var datos = registros[requisiciones].insumos;
                clues = registros[requisiciones].clues;
                id_acta_unidad = registros[requisiciones].acta_id;


                for(var datos_insumos in datos){
                    var new_insumo = {};
                    new_insumo =
                    {
                        cantidad                : datos[datos_insumos].pivot['cantidad'],
                        cause                   : datos[datos_insumos].cause,
                        clave                   : datos[datos_insumos].clave,
                        controlado              : datos[datos_insumos].controlado,
                        descripcion             : datos[datos_insumos].descripcion,
                        id                      : datos[datos_insumos].id,
                        insumo_id               : datos[datos_insumos].id,
                        lote                    : datos[datos_insumos].lote,
                        pedido                  : datos[datos_insumos].pedido,
                        precio                  : datos[datos_insumos].precio,
                        tipo                    : datos[datos_insumos].tipo,
                        unidad                  : datos[datos_insumos].unidad,
                        surfactante             : datos[datos_insumos].surfactante,
                        requisicion_id_unidad   : id_acta_unidad,
                        total                   : parseFloat(datos[datos_insumos].pivot['total'])
                    }

                    if(!$scope.elementos.por_clues[clues]){
                        $scope.elementos.por_clues[clues] = { insumos: [] };
                    }

                    $scope.elementos.por_clues[clues].insumos.push(new_insumo);
                    $scope.elementos.por_clues[clues].requisicion_acta_id = id_acta_unidad;

                    if($scope.elementos.concentrado_indices[new_insumo.insumo_id] == undefined){
                        $scope.elementos.concentrado_indices[new_insumo.insumo_id] = $scope.elementos.concentrado.length;
                        new_insumo = JSON.parse(JSON.stringify(new_insumo));
                        new_insumo.cantidad = 0;
                        new_insumo.total = 0;
                        $scope.elementos.concentrado.push(new_insumo);
                    }

                    $scope.insumos_estatus.nuevos[new_insumo.id] = true;
                    if(!$scope.elementos.concentrado[$scope.elementos.concentrado_indices[new_insumo.insumo_id]])
                    {
                        $scope.elementos.concentrado[$scope.elementos.concentrado_indices[new_insumo.insumo_id]] = { total : 0, cantidad : 0 }
                    }

                    //console.log("["+$scope.elementos.concentrado_indices[new_insumo.insumo_id]+"]"+$scope.elementos.concentrado[$scope.elementos.concentrado_indices[new_insumo.insumo_id]].cantidad+" + "+datos[datos_insumos].pivot['cantidad']);
                    $scope.elementos.concentrado[$scope.elementos.concentrado_indices[new_insumo.insumo_id]].cantidad += datos[datos_insumos].pivot['cantidad'];
                    $scope.elementos.concentrado[$scope.elementos.concentrado_indices[new_insumo.insumo_id]].total += parseFloat(datos[datos_insumos].pivot['total']);

                    //Ajsutar Subtotales
                    if(new_insumo.tipo == 1 && new_insumo.cause == 1 && new_insumo.surfactante == 1){
                        $scope.subtotales.surfactante_causes += parseFloat(new_insumo.total);
                    }else if(new_insumo.tipo == 1 && new_insumo.cause == 0 && new_insumo.surfactante == 1){
                        $scope.subtotales.surfactante_no_causes += parseFloat(new_insumo.total);
                    }else if(new_insumo.tipo == 1 && new_insumo.cause == 1 && new_insumo.controlado == 0){
                        $scope.subtotales.causes += parseFloat(new_insumo.total);
                    }else if(new_insumo.tipo == 1 && new_insumo.cause == 1 && new_insumo.controlado == 1){
                        $scope.subtotales.controlados += parseFloat(new_insumo.total);
                    }else if(new_insumo.tipo == 1 && new_insumo.cause == 0){
                        $scope.subtotales.no_causes += parseFloat(new_insumo.total);
                    }else{
                        $scope.subtotales.material_curacion += (new_insumo.total+(new_insumo.total*16/100));
                    }

                    $scope.totales.subtotal += new_insumo.total;

                    if(new_insumo.tipo == 2){
                        var iva = (new_insumo.total*16/100);
                        $scope.totales.iva += iva;
                    }

                    $scope.totales.total = $scope.totales.iva + $scope.totales.subtotal;

                }
            }

            reindicarunidad($scope.modulo.elementos.por_clues[clues]);
            $scope.modulo.cambios = true;
            $scope.modulo.elementos = $scope.elementos;
            $scope.modulo.subtotales = $scope.subtotales;
            $scope.modulo.totales = $scope.totales;
            $scope.modulo.insumos_estatus = $scope.insumos_estatus;
            $scope.modulo.lista_clues = $scope.lista_clues;


        }

        function reindicarunidad(elementos_clues)
        {
            var acta_unidad = elementos_clues.requisicion_acta_id;
            for(var i in elementos_clues.insumos)
            {
                elementos_clues.insumos[i].requisicion_id_unidad = acta_unidad;
            }
        }

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
                    RequisicionesDataApi.importar($scope.informacionArchivo,function(res){

                        $scope.cargando = false;
                        input.val(null);
                        $scope.informacionArchivo = null;
                        $scope.importarDatos(res);

                       //$scope.lista_insumos = $scope.elementos.concentrado;
                    },function(e){
                        $scope.cargando = false;
                        input.val(null);
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