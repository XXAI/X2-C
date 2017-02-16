(function(){
	'use strict';
    angular.module('RecepcionModule')
    .controller('RecepcionCtrl',
    ['$rootScope', '$scope', 'RecepcionDataApi', '$mdSidenav','$location','$http','URLS','$timeout','$mdBottomSheet','Auth','Menu','UsuarioData','$mdMedia','$mdDialog','$document','Mensajero', 
    function($rootScope, $scope, RecepcionDataApi,$mdSidenav,$location,$http,URLS,$timeout,$mdBottomSheet,Auth, Menu, UsuarioData,$mdMedia,$mdDialog,$document,Mensajero){
        $scope.menuSelected = $location.path();
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();

        $scope.filtro = {aplicado:false};
        $scope.menuFiltro = {estatus:'todos'};
        $scope.textoBuscado = '';

        $scope.permisoRecibir = '721A42C7F4693';

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

                RecepcionDataApi.lista(parametros,function (res) {
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
                            requisiciones:'',
                            numero_requisiciones: res.data[i].requisiciones.length,
                            total_claves_recibidas:res.data[i].total_claves_recibidas,
                            total_claves_validadas:res.data[i].total_claves_validadas,
                            total_cantidad_recibida: res.data[i].total_cantidad_recibida,
                            total_cantidad_validada: res.data[i].total_cantidad_validada,
                            total_validado: 0
                        };

                        if(res.data[i].estatus == 1){
                            $scope.actaNueva = res.data[i].id;
                        }else if(res.data[i].estatus_sincronizacion == 0){
                            obj.icono = 'sync-alert';
                        }else if(res.data[i].estatus == 2){
                            obj.icono = 'file-send';
                        }else if(res.data[i].estatus == 3){
                            obj.icono = 'file-check';
                        }else if(res.data[i].estatus > 3){
                            obj.icono = 'file-lock';
                        }

                        if(res.data[i].fecha_pedido){
                            obj.fecha_pedido = new Date(res.data[i].fecha_pedido);
                        }

                        var requisiciones_arreglo = [];
                        var repetidos = {};
                        for(var j in res.data[i].requisiciones){
                            var requisicion = res.data[i].requisiciones[j];
                            obj.total_validado +=  parseFloat(requisicion.gran_total_validado) || 0;
                            if(!repetidos[requisicion.numero]){
                                repetidos[requisicion.numero] = true;
                                requisiciones_arreglo.push(requisicion.numero);
                            }
                        }
                        obj.requisiciones = requisiciones_arreglo.join(' - ');
                        
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
                        Mensajero.mostrarToast({contenedor:'#modulo-recepcion',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para listar estos elementos.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-recepcion',titulo:'Error:',mensaje:'Ocurrió un error al intentar listar los elementos.'});
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
    .controller('FormRecepcionCtrl',
    ['$rootScope', '$scope', 'RecepcionDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage','$timeout',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','$window','Mensajero','ImprimirEntrada',
    function(
    $rootScope, $scope, RecepcionDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,$timeout,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,$window,Mensajero,ImprimirEntrada
    ){
        $scope.menuSelected = "/recepcion";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;
        $scope.insumos_por_clues = {};
        $scope.cargando = true;
        $scope.aplicar_proveedor = {};
        $scope.totales = {pedido:0, recibido:0, restante:0, porcentaje:0.00};
        $scope.ingresos_requisicion = {};
        $scope.recepcion = {estatus:1};
        $scope.entregas_guardadas = {};
        $scope.reporte_imprimir = undefined;
        $scope.tipos_requisiciones = [];
        

        //nuevo esquema
        $scope.filtro_insumos = {busqueda:'',tipo_insumo:{clave:0}};
        $scope.lista_insumos = [];
        $scope.lista_insumos_con_filtro = [];
        $scope.entrega_proveedor = {};
        $scope.ingresos_proveedores = {}; //llave proveedor_id => {insumo_id:{lotes:[{lote,fecha_caducidad,cantidad}], cantidad:0}}

        $scope.permisoRecibir = '721A42C7F4693';

        $scope.tipos_requisiciones.push({
            'clave': 0,
            'descripcion': 'Todos'
        });

        $scope.cambiar_filtro_insumos = function(){
            var lista_entregados_proveedor = {};
            var nuevo_filtro = {};
            if($scope.filtro_insumos.tipo_insumo.clave){
                nuevo_filtro.tipo_requisicion = $scope.filtro_insumos.tipo_insumo.clave;
            }

            if($scope.aplicar_proveedor.id){
                nuevo_filtro.proveedor_id = $scope.aplicar_proveedor.id;
                lista_entregados_proveedor = $scope.entrega_proveedor[$scope.aplicar_proveedor.id];
            }

            if($scope.filtro_insumos.ocultar_completos){
                nuevo_filtro.completo = false;
            }

            var lista_filtrada = $filter('filter')($scope.lista_insumos,nuevo_filtro);

            if($scope.filtro_insumos.busqueda){
                var busqueda_query = $scope.filtro_insumos.busqueda;
                $scope.lista_insumos_con_filtro = lista_filtrada.filter( createFilterFor(busqueda_query,['clave','descripcion']));
            }else{
                $scope.lista_insumos_con_filtro = lista_filtrada;
            }

            $scope.totales.pedido = 0;
            $scope.totales.recibido = 0;
            for(var i in $scope.lista_insumos_con_filtro){
                $scope.totales.pedido += $scope.lista_insumos_con_filtro[i].cantidad_validada;
                $scope.totales.recibido += $scope.lista_insumos_con_filtro[i].cantidad_recibida;
                if(lista_entregados_proveedor[$scope.lista_insumos_con_filtro[i].insumo_id]){
                    $scope.totales.recibido += lista_entregados_proveedor[$scope.lista_insumos_con_filtro[i].insumo_id];
                }
            }
            $scope.totales.restante = $scope.totales.pedido - $scope.totales.recibido;
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

        RecepcionDataApi.ver($routeParams.id,function(res){
            $scope.acta = res.data;
            $scope.configuracion = res.configuracion;
            $scope.proveedores = [];
            var proveedores = {};

            //para poder activar y desactivar proveedores
            for(var i in res.proveedores){
                var proveedor = res.proveedores[i];
                proveedores[i] = {nombre:proveedor,activo:false};
            }
            
            $scope.entregas_guardadas = {};
            $scope.entregas_imprimir = {};
            $scope.lista_entregas_imprimir = [];

            if($scope.acta.entradas.length){
                for(var i in $scope.acta.entradas){
                    var entrega = $scope.acta.entradas[i];

                    if(entrega.fecha_recibe){
                        entrega.fecha_recibe = new Date(entrega.fecha_recibe + ' 00:00:00');
                    }

                    if(entrega.hora_recibe){
                        var horaEntrega = entrega.hora_recibe.split(':')
                        entrega.hora_recibe_date =  new Date(1970, 0, 1, horaEntrega[0], horaEntrega[1], 0);
                    }

                    if(entrega.estatus <= 2){
                        $scope.entregas_guardadas[entrega.proveedor_id] = entrega;
                    }else{
                        if(!$scope.entregas_imprimir[entrega.proveedor_id]){
                            $scope.entregas_imprimir[entrega.proveedor_id] = entrega;
                        }
                        entrega.proveedor_nombre = proveedores[entrega.proveedor_id].nombre;
                        $scope.lista_entregas_imprimir.push(entrega);
                    }

                    if(entrega.estatus == 1){
                        $scope.ingresos_proveedores[entrega.proveedor_id] = {};
                        for(var j in entrega.stock){
                            if(!$scope.ingresos_proveedores[entrega.proveedor_id][entrega.stock[j].insumo_id]){
                                $scope.ingresos_proveedores[entrega.proveedor_id][entrega.stock[j].insumo_id] = {cantidad:0,lotes:[]};
                            }
                            $scope.ingresos_proveedores[entrega.proveedor_id][entrega.stock[j].insumo_id].cantidad += entrega.stock[j].cantidad_recibida;

                            $scope.ingresos_proveedores[entrega.proveedor_id][entrega.stock[j].insumo_id].lotes.push({
                                //insumo_id: entrega.stock[j].insumo_id,
                                cantidad: entrega.stock[j].cantidad_recibida,
                                fecha_caducidad: (entrega.stock[j].fecha_caducidad)?new Date(entrega.stock[j].fecha_caducidad + ' 00:00:00'):undefined,
                                lote: entrega.stock[j].lote,
                                validacion:{}
                            });
                        }
                    }
                }
                $scope.acta.entradas = undefined;
            }
            
            for(var i in $scope.acta.requisiciones){
                var requisicion = $scope.acta.requisiciones[i];

                var descripcion_requisicion = 'Causes';
                if(requisicion.tipo_requisicion == 2){
                    descripcion_requisicion = 'No Causes';
                }else if(requisicion.tipo_requisicion == 3){
                    descripcion_requisicion = 'Material de Curación';
                }else if(requisicion.tipo_requisicion == 4){
                    descripcion_requisicion = 'Controlados';
                }else if(requisicion.tipo_requisicion == 5){
                    descripcion_requisicion = 'Surfactante Causes';
                }else if(requisicion.tipo_requisicion == 6){
                    descripcion_requisicion = 'Surfactante No Causes';
                }

                $scope.tipos_requisiciones.push({
                    'clave': requisicion.tipo_requisicion,
                    'descripcion': descripcion_requisicion,
                    'index': i
                });
                
                for(var j in requisicion.insumos){
                    var insumo = {};
                    
                    insumo.descripcion = requisicion.insumos[j].descripcion;
                    insumo.clave = requisicion.insumos[j].clave;
                    insumo.lote = requisicion.insumos[j].lote;
                    insumo.unidad = requisicion.insumos[j].unidad;
                    insumo.precio = requisicion.insumos[j].precio;

                    insumo.insumo_id = requisicion.insumos[j].id;
                    insumo.cantidad = requisicion.insumos[j].pivot.cantidad;
                    insumo.total = parseFloat(requisicion.insumos[j].pivot.total);
                    insumo.cantidad_validada = requisicion.insumos[j].pivot.cantidad_validada;
                    insumo.total_validado = parseFloat(requisicion.insumos[j].pivot.total_validado);
                    insumo.cantidad_recibida = requisicion.insumos[j].pivot.cantidad_recibida || 0;
                    insumo.total_recibido = parseFloat(requisicion.insumos[j].pivot.total_recibido) || 0;
                    insumo.requisicion_id = requisicion.insumos[j].pivot.requisicion_id;
                    insumo.proveedor_id = requisicion.insumos[j].pivot.proveedor_id;

                    insumo.tipo_requisicion = requisicion.tipo_requisicion;

                    if(insumo.cantidad_recibida >= insumo.cantidad_validada){
                        insumo.completo = true;
                    }else{
                        insumo.completo = false;
                    }

                    //activamos el proveedor en el select de proveedores
                    proveedores[insumo.proveedor_id].activo = true;

                    if(!$scope.entrega_proveedor[insumo.proveedor_id]){
                        $scope.entrega_proveedor[insumo.proveedor_id] = {};
                    }
                    
                    if($scope.ingresos_proveedores[insumo.proveedor_id]){
                        if($scope.ingresos_proveedores[insumo.proveedor_id][insumo.insumo_id]){
                            $scope.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id] = $scope.ingresos_proveedores[insumo.proveedor_id][insumo.insumo_id].cantidad;
                            $scope.totales.recibido += $scope.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id];
                        }else{
                            $scope.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id] = 0;
                        }
                    }else{
                        $scope.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id] = 0;
                    }

                    insumo.restante = insumo.cantidad_validada - insumo.cantidad_recibida - $scope.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id];

                    $scope.totales.pedido += insumo.cantidad_validada;
                    $scope.totales.recibido += insumo.cantidad_recibida;

                    $scope.lista_insumos.push(insumo);
                }
            }
            $scope.totales.restante += $scope.totales.pedido - $scope.totales.recibido;
            
            for(var i in proveedores){
                if(proveedores[i].activo){
                    $scope.proveedores.push({id:i,nombre:proveedores[i].nombre})
                }
            }

            $scope.lista_insumos_con_filtro = $scope.lista_insumos;

            $scope.cargando = false;
        },function(e){
            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
            console.log(e);
        });

        $scope.recibirInsumo = function(ev,insumo){
            if(!$scope.recepcionIniciada){ return false; }
            if($scope.recepcion.estatus > 1){ return false; }

            var tipo_requisicion = $scope.filtro_insumos.tipo_insumo.clave;
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            
            if(!$scope.ingresos_proveedores[insumo.proveedor_id]){
                $scope.ingresos_proveedores[insumo.proveedor_id] = {};
            }
            /*if(!$scope.ingresos_requisicion[insumo.proveedor_id]){
                $scope.ingresos_requisicion[insumo.proveedor_id] = {};
            }*/



            var locals = {
                insumo: insumo,
                lista_insumos: $scope.lista_insumos_con_filtro,
                //lista_ingresos: $scope.ingresos_requisicion[insumo.proveedor_id],
                lista_ingresos: $scope.ingresos_proveedores[insumo.proveedor_id],
                entrega_proveedor: $scope.entrega_proveedor[insumo.proveedor_id],
                totales: $scope.totales
            };

            $mdDialog.show({
                controller: function($scope, $mdDialog, insumo, lista_insumos, lista_ingresos, entrega_proveedor, totales) {
                    $scope.insumo = insumo;
                    $scope.lista_insumos = lista_insumos;
                    $scope.lista_ingresos = lista_ingresos;
                    $scope.entrega_proveedor = entrega_proveedor;
                    $scope.totales = totales;

                    var regresarRespaldo = function(){
                        if($scope.ingreso_respaldo){
                            for(var i in $scope.ingreso_respaldo.lotes){
                                if($scope.ingreso_respaldo.lotes[i].fecha_caducidad){
                                    $scope.ingreso_respaldo.lotes[i].fecha_caducidad = new Date($scope.ingreso_respaldo.lotes[i].fecha_caducidad);
                                }
                            }
                            $scope.ingreso = $scope.ingreso_respaldo;
                            $scope.lista_ingresos[$scope.insumo.insumo_id] = $scope.ingreso;
                        }
                    };

                    var cargarIngreso = function(){
                        if($scope.lista_ingresos[$scope.insumo.insumo_id]){
                            $scope.ingreso = $scope.lista_ingresos[$scope.insumo.insumo_id];
                            $scope.ingreso_respaldo = JSON.parse(JSON.stringify($scope.ingreso));
                            if(!$scope.ingreso.lotes.length){
                                $scope.ingreso.lotes.push({});
                            }
                        }else{
                            $scope.ingreso = {cantidad:0,lotes:[{}]};
                            $scope.ingreso_respaldo = undefined;
                        }
                        if($scope.ingreso.cantidad == 0){
                            $timeout(function(){
                                var element = $window.document.getElementById('ingreso_lote_0');
                                element.focus();
                            },200);
                        }
                    };

                    cargarIngreso();

                    $scope.quitarLote = function(index){
                        $scope.ingreso.lotes.splice(index,1);
                    };

                    $scope.agregarLote = function(){
                        $scope.ingreso.lotes.push({});
                        $timeout(function(){
                            var ultimo_lote = $scope.ingreso.lotes.length-1;
                            var element = $window.document.getElementById('ingreso_lote_'+ultimo_lote);
                            element.focus();
                        },200);
                    };

                    $scope.cancel = function() {
                        regresarRespaldo();
                        $mdDialog.cancel();
                    };

                    $scope.answer = function(cerrar) {
                        //$scope.validacion = {};
                        var errores = false;

                        $scope.ingreso.cantidad = 0;
                        //var indices_a_quitar = [];
                        for(var i in $scope.ingreso.lotes){
                            var lote_capturado = $scope.ingreso.lotes[i];

                            lote_capturado.validacion = {};

                            if(!lote_capturado.lote){
                                lote_capturado.validacion.lote = {required:true};
                                errores = true;
                            }

                            if(lote_capturado.fecha_caducidad){
                                var hoy = new Date();
                                if(lote_capturado.fecha_caducidad < hoy){
                                    lote_capturado.validacion.fecha_caducidad = {min:true};
                                    errores = true;
                                }
                            }

                            /*var hoy = new Date();
                            if(!lote_capturado.fecha_caducidad){
                                lote_capturado.validacion.fecha_caducidad = {required:true};
                                errores = true;
                            }else if(lote_capturado.fecha_caducidad < hoy){
                                lote_capturado.validacion.fecha_caducidad = {min:true};
                                errores = true;
                            }*/

                            if(lote_capturado.cantidad == undefined){
                                lote_capturado.validacion.cantidad = {required:true};
                                errores = true;
                            }else{
                                $scope.ingreso.cantidad += lote_capturado.cantidad;
                                if(lote_capturado.cantidad < 0){
                                    lote_capturado.validacion.cantidad = {min:true};
                                    errores = true;
                                }else if($scope.ingreso.cantidad > ($scope.insumo.cantidad_validada - $scope.insumo.cantidad_recibida)){
                                    lote_capturado.validacion.cantidad = {max:true};
                                    errores = true;
                                }else if(lote_capturado.cantidad == 0){
                                    //indices_a_quitar.push(i);
                                    $scope.ingreso.lotes.splice(i,1);
                                }
                            }
                        }

                        if(errores){
                            return false;
                        }

                        /*if(indices_a_quitar.length){
                            for(var i in indices_a_quitar){
                                $scope.ingreso.lotes.splice(indices_a_quitar[i],1);
                            }
                        }*/

                        if(!$scope.lista_ingresos[$scope.insumo.insumo_id] && $scope.ingreso.lotes.length){
                            $scope.lista_ingresos[$scope.insumo.insumo_id] = $scope.ingreso;
                        }

                        if($scope.ingreso_respaldo){
                            $scope.insumo.restante += $scope.ingreso_respaldo.cantidad;
                            $scope.totales.recibido -= $scope.ingreso_respaldo.cantidad;
                        }

                        $scope.entrega_proveedor[$scope.insumo.insumo_id] = $scope.ingreso.cantidad;

                        $scope.insumo.restante -= $scope.ingreso.cantidad;
                        $scope.totales.recibido += $scope.ingreso.cantidad;
                        $scope.totales.restante = $scope.totales.pedido - $scope.totales.recibido;
                        
                        $scope.ingreso_respaldo = undefined;

                        if(cerrar){
                            $mdDialog.hide({yes:true});
                        }else{
                            //$scope.siguiente();
                            var element = $window.document.getElementById('ingreso_lote');
                            element.focus();
                        }
                    };
                },
                templateUrl: 'src/recepcion/views/recepcion-insumo.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:false,
                escapeToClose:false,
                focusOnOpen:false,
                fullscreen: useFullScreen,
                locals:locals
            })
            .then(function(res) {
                //$scope.actualizarTotal($scope.selectedIndex);
            }, function() {
                //console.log('cancelado');
            });
        };

        var prepararGuardado = function(){
            var entrega = $scope.recepcion;
            entrega.hora_recibe = $filter('date')(entrega.hora_recibe_date,'HH:mm:ss');
            entrega.acta_id = $scope.acta.id;
            
            //entrega.ingresos_requisicion = $scope.ingresos_requisicion[$scope.recepcion.proveedor_id];
            entrega.ingresos_proveedor = $scope.ingresos_proveedores[$scope.recepcion.proveedor_id];
            return entrega;
        };

        $scope.finalizarEntrega = function(ev){
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            var locals = {
                entrega: prepararGuardado(),
                entregas_guardadas: $scope.entregas_guardadas
            };
            $mdDialog.show({
                controller: function($scope, $mdDialog, entrega, entregas_guardadas) {
                    $scope.recepcion = entrega;
                    $scope.entregas_guardadas = entregas_guardadas;
                    
                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };

                    $scope.answer = function(cerrar) {
                        $scope.cargando = true;
                        $scope.validacion = {};
                        var errores = false;

                        if(!$scope.recepcion.nombre_recibe){
                            $scope.validacion.nombre_recibe = {required:true};
                            errores = true;
                        }

                        if(!$scope.recepcion.nombre_entrega){
                            $scope.validacion.nombre_entrega = {required:true};
                            errores = true;
                        }

                        if(errores){
                            $scope.cargando = false;
                            return false;
                        }
                        
                        entrega.estatus = 2;

                        RecepcionDataApi.guardarEntrega(entrega,function(res){
                            $scope.recepcion.estatus = res.data.estatus;
                            $scope.recepcion.id = res.data.id;
                            if(!$scope.entregas_guardadas[$scope.recepcion.proveedor_id]){
                                $scope.entregas_guardadas[$scope.recepcion.proveedor_id] = $scope.recepcion;
                            }
                            $scope.cargando = false;

                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos guardados con éxito.'});
                            $mdDialog.hide({yes:true});
                        },function(e){
                            $scope.cargando = false;
                            if(e.data){
                                $scope.recepcion.estatus = e.data.estatus;
                            }else if($scope.recepcion.estatus == 2){
                                $scope.recepcion.estatus = 1;
                            }
                            if(e.error_type == 'form_validation'){
                                Mensajero.mostrarToast({contenedor:'#modulo-dialogo',titulo:'Error:',mensaje:'Hay un error en los datos del formulario.'});
                                var errors = e.error;
                                for (var i in errors){
                                    var error = JSON.parse('{ "' + errors[i] + '" : true }');
                                    $scope.validacion[i] = error;
                                }
                            }else if(e.error_type == 'data_validation'){
                                Mensajero.mostrarToast({contenedor:'#modulo-dialogo',titulo:'Error:',mensaje:e.error});
                                if(e.data.id){
                                    $mdDialog.hide({yes:true});
                                }
                            }else{
                                Mensajero.mostrarToast({contenedor:'#modulo-dialogo',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                            }
                        });
                    };
                },
                templateUrl: 'src/recepcion/views/finalizar-recepcion.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:false,
                escapeToClose:false,
                fullscreen: useFullScreen,
                locals:locals
            })
            .then(function(res) {
                //$scope.actualizarTotal($scope.selectedIndex);
            }, function() {
                //console.log('cancelado');
            });
        }
        
        $scope.guardarEntrega = function(){
            $scope.cargando = true;
            $scope.validacion = {};
            
            var entrega = prepararGuardado();

            RecepcionDataApi.guardarEntrega(entrega,function(res){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos guardados con éxito.'});
                $scope.recepcion.estatus = res.data.estatus;
                $scope.recepcion.id = res.data.id;
                if(!$scope.entregas_guardadas[$scope.recepcion.proveedor_id]){
                    $scope.entregas_guardadas[$scope.recepcion.proveedor_id] = $scope.recepcion;
                }
                $scope.cargando = false;
            },function(e){
                $scope.cargando = false;
                if(e.data){
                    $scope.recepcion.estatus = e.data.estatus;
                }else if($scope.recepcion.estatus == 2){
                    $scope.recepcion.estatus = 1;
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
        };

        $scope.cambiarProveedor = function(){
            $scope.recepcion = {estatus:1};
            $scope.reporte_imprimir = undefined;
            
            if($scope.aplicar_proveedor.id){
                $scope.recepcionIniciada = true;

                if($scope.entregas_guardadas[$scope.aplicar_proveedor.id]){
                    $scope.recepcion = $scope.entregas_guardadas[$scope.aplicar_proveedor.id];
                    if(!$scope.recepcion.nombre_recibe){
                        $scope.recepcion.nombre_recibe = $scope.configuracion.encargado_almacen;
                    }
                }else{
                    $scope.recepcion.proveedor_id = $scope.aplicar_proveedor.id;

                    var fecha_actual = new Date();
                    fecha_actual = new Date(fecha_actual.getFullYear(), fecha_actual.getMonth(), fecha_actual.getDate(), fecha_actual.getHours(), fecha_actual.getMinutes(), 0);
                    
                    $scope.recepcion.fecha_recibe = fecha_actual;
                    $scope.recepcion.hora_recibe_date = fecha_actual;

                    $scope.recepcion.nombre_recibe = $scope.configuracion.encargado_almacen;
                }

                if($scope.entregas_imprimir[$scope.aplicar_proveedor.id]){
                    $scope.reporte_imprimir = $scope.entregas_imprimir[$scope.aplicar_proveedor.id];
                }
                
            }else{
                $scope.recepcionIniciada = false;
                $scope.recepcion.proveedor_id = undefined;
            }
            $scope.cambiar_filtro_insumos();
        };

        $scope.imprimirEntrega = function(id){
            //RequisicionesDataApi.verPDF($routeParams.id,function(e){console.log(e)});
            //window.open(URLS.BASE_API +'/solicitudes-pdf/'+$routeParams.id);
            $scope.cargando = true;
            RecepcionDataApi.verEntrega(id,function(res){
                ImprimirEntrada.imprimir(res.data, res.configuracion, res.proveedor).then(
                            function(res){
                                $scope.cargando = false
                            },function(err){
                                console.log('error');
                                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:err});
                                $scope.cargando = false
                            });
            },function(e){
                $scope.cargando = false;
            });
        };

        $scope.sincronizar = function(){
            $scope.cargando = true;
            RecepcionDataApi.sincronizar($scope.recepcion.id,function(res){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos sincronizados con éxito.'});
                $scope.recepcion.estatus = res.data.estatus;
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
        };

        $scope.abrirListaEntradas = function(){
            $mdSidenav('lista-entradas-acta').open();
        };

        $scope.cerrarListaEntradas = function(){
            $mdSidenav('lista-entradas-acta').close();
        };

        $scope.generarExcel = function(){
            window.open(URLS.BASE_API +'/entrada-acta-excel/'+$routeParams.id+'?token='+$localStorage.control_desabasto.access_token);
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