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
    .controller('FormPedidoCtrl',
    ['$rootScope', '$scope', 'PedidosDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','$window','Mensajero',
    function(
    $rootScope, $scope, PedidosDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,$window,Mensajero
    ){
        $scope.menuSelected = "/pedidos";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;
        $scope.insumos_por_clues = {};
        $scope.cargando = true;
        $scope.aplicar_proveedor = {};
        $scope.totales = {pedido:0, recibido:0, restante:0, porcentaje:0.00};
        $scope.lista_insumos_requisicion = {1:[],2:[],3:[],4:[]};
        $scope.ingresos_requisicion = {1:{},2:{},3:{},4:{}};
        $scope.recepcion = {estatus:1};
        $scope.entregas_guardadas = {};
        $scope.reportes_imprimir = [];

        $scope.permisoRecibir = '721A42C7F4693';

        PedidosDataApi.ver($routeParams.id,function(res){
            $scope.acta = res.data;
            $scope.configuracion = res.configuracion;
            $scope.proveedores = res.proveedores;
            var insumos_entregados = {};

            $scope.entregas_guardadas = {};
            $scope.entregas_imprimir = {};
            if($scope.acta.entregas.length){
                for(var i in $scope.acta.entregas){
                    var entrega = $scope.acta.entregas[i];
                    if(entrega.fecha_entrega){
                        entrega.fecha_entrega = new Date(entrega.fecha_entrega + ' 00:00:00');
                    }

                    if(entrega.fecha_proxima_entrega){
                        entrega.fecha_proxima_entrega = new Date(entrega.fecha_proxima_entrega + ' 00:00:00');
                    }

                    if(entrega.hora_entrega){
                        var horaEntrega = entrega.hora_entrega.split(':')
                        entrega.hora_entrega_date =  new Date(1970, 0, 1, horaEntrega[0], horaEntrega[1], 0);
                    }

                    if(entrega.estatus <= 2){
                        $scope.entregas_guardadas[entrega.proveedor_id] = entrega;
                    }else{
                        if(!$scope.entregas_imprimir[entrega.proveedor_id]){
                            $scope.entregas_imprimir[entrega.proveedor_id] = [];
                        }
                        $scope.entregas_imprimir[entrega.proveedor_id].push(entrega);
                    }

                    if(entrega.estatus == 1){
                        insumos_entregados[entrega.proveedor_id] = {};
                        for(var j in entrega.stock){
                            insumos_entregados[entrega.proveedor_id][entrega.stock[j].insumo_id] = {
                                insumo_id: entrega.stock[j].insumo_id,
                                cantidad: entrega.stock[j].cantidad_entregada,
                                fecha_caducidad: new Date(entrega.stock[j].fecha_caducidad + ' 00:00:00'),
                                lote: entrega.stock[j].lote
                            };
                        }
                    }
                }
                $scope.acta.entregas = undefined;
            }
            
            for(var i in $scope.acta.requisiciones){
                var requisicion = $scope.acta.requisiciones[i];
                requisicion.insumos_proveedor = {};
                requisicion.entrega_proveedor = {};

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

                    if(!requisicion.insumos_proveedor[insumo.proveedor_id]){
                        requisicion.insumos_proveedor[insumo.proveedor_id] = [];
                        requisicion.entrega_proveedor[insumo.proveedor_id] = {};
                    }
                    
                    requisicion.insumos_proveedor[insumo.proveedor_id].push(insumo);
                    requisicion.insumos[j] = insumo;
                    if(insumos_entregados[insumo.proveedor_id]){
                        if(insumos_entregados[insumo.proveedor_id][insumo.insumo_id]){
                            requisicion.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id] = insumos_entregados[insumo.proveedor_id][insumo.insumo_id].cantidad;
                            if(!$scope.ingresos_requisicion[requisicion.tipo_requisicion][insumo.proveedor_id]){
                                $scope.ingresos_requisicion[requisicion.tipo_requisicion][insumo.proveedor_id] = {};
                            }
                            $scope.ingresos_requisicion[requisicion.tipo_requisicion][insumo.proveedor_id][insumo.insumo_id] = insumos_entregados[insumo.proveedor_id][insumo.insumo_id];
                        }else{
                            requisicion.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id] = 0;
                        }
                    }else{
                        requisicion.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id] = 0;
                    }

                    insumo.restante = insumo.cantidad_validada - insumo.cantidad_recibida - requisicion.entrega_proveedor[insumo.proveedor_id][insumo.insumo_id];

                    $scope.totales.pedido += insumo.cantidad_validada;
                    $scope.totales.recibido += insumo.cantidad_recibida;
                    $scope.totales.restante += insumo.restante;
                }
                $scope.lista_insumos_requisicion[requisicion.tipo_requisicion] = requisicion.insumos;
            }
            //console.log($scope.insumos_por_clues);
            $scope.cargando = false;
        },function(e){
            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
            console.log(e);
        });

        $scope.recibirInsumo = function(ev,insumo){
            if(!$scope.recepcionIniciada){ return false; }
            if($scope.recepcion.estatus > 1){ return false; }

            var tipo_requisicion = $scope.acta.requisiciones[$scope.selectedIndex].tipo_requisicion;
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;

            if(!$scope.ingresos_requisicion[tipo_requisicion][insumo.proveedor_id]){
                $scope.ingresos_requisicion[tipo_requisicion][insumo.proveedor_id] = {};
            }

            var locals = {
                insumo: insumo,
                lista_insumos: $scope.lista_insumos_requisicion[tipo_requisicion],
                lista_ingresos: $scope.ingresos_requisicion[tipo_requisicion][insumo.proveedor_id],
                entrega_proveedor: $scope.acta.requisiciones[$scope.selectedIndex].entrega_proveedor[insumo.proveedor_id],
                totales: $scope.totales
            };

            $mdDialog.show({
                controller: function($scope, $mdDialog, insumo, lista_insumos, lista_ingresos, entrega_proveedor, totales) {
                    $scope.insumo = insumo;
                    $scope.lista_insumos = lista_insumos;
                    $scope.lista_ingresos = lista_ingresos;
                    $scope.entrega_proveedor = entrega_proveedor;
                    $scope.totales = totales;
                    $scope.validacion = {};
                    
                    $scope.index_siguiente = undefined;
                    $scope.index_anterior = undefined;
                    $scope.index_actual = lista_insumos.indexOf(insumo);
                    $scope.total_insumos = lista_insumos.length;

                    if($scope.index_actual === 0){
                        $scope.index_siguiente = 1;
                        $scope.index_anterior = undefined;
                    }else if($scope.index_actual == ($scope.total_insumos-1)){
                        $scope.index_siguiente = undefined;
                        $scope.index_anterior = $scope.index_actual-1;
                    }else{
                        $scope.index_siguiente = $scope.index_actual+1;
                        $scope.index_anterior = $scope.index_actual-1;
                    }

                    var regresarRespaldo = function(){
                        if($scope.ingreso_respaldo){
                            $scope.ingreso.lote = $scope.ingreso_respaldo.lote;
                            $scope.ingreso.fecha_caducidad = new Date($scope.ingreso_respaldo.fecha_caducidad);
                            $scope.ingreso.cantidad = $scope.ingreso_respaldo.cantidad;
                        }
                    };

                    var cargarIngreso = function(){
                        if($scope.lista_ingresos[$scope.insumo.insumo_id]){
                            $scope.ingreso = $scope.lista_ingresos[$scope.insumo.insumo_id]
                            $scope.ingreso_respaldo = JSON.parse(JSON.stringify($scope.ingreso));
                        }else{
                            $scope.ingreso = {insumo_id:$scope.insumo.insumo_id};
                            $scope.ingreso_respaldo = undefined;
                        }
                    };

                    cargarIngreso();

                    $scope.siguiente = function(){
                        if($scope.index_siguiente != undefined){
                            $scope.index_anterior = $scope.index_actual;
                            $scope.index_actual = $scope.index_siguiente;
                            $scope.index_siguiente += 1;
                            if($scope.index_siguiente == $scope.total_insumos){
                                $scope.index_siguiente = undefined;
                            }
                        }
                        $scope.validacion = {};
                        regresarRespaldo();
                        $scope.insumo = $scope.lista_insumos[$scope.index_actual];
                        cargarIngreso();
                    };

                    $scope.anterior = function(){
                        if($scope.index_anterior != undefined){
                            $scope.index_siguiente = $scope.index_actual;
                            $scope.index_actual = $scope.index_anterior;
                            $scope.index_anterior -= 1;
                            if($scope.index_anterior < 0){
                                $scope.index_anterior = undefined;
                            }
                        }
                        $scope.validacion = {};
                        regresarRespaldo();
                        $scope.insumo = $scope.lista_insumos[$scope.index_actual];
                        cargarIngreso();
                    };
                    
                    $scope.cancel = function() {
                        regresarRespaldo();
                        $mdDialog.cancel();
                    };

                    $scope.answer = function(cerrar) {
                        $scope.validacion = {};
                        var errores = false;

                        if(!$scope.ingreso.lote){
                            $scope.validacion.lote = {required:true};
                            errores = true;
                        }

                        if(!$scope.ingreso.fecha_caducidad){
                            $scope.validacion.fecha_caducidad = {required:true};
                            errores = true;
                        }

                        if($scope.ingreso.cantidad == undefined){
                            $scope.validacion.cantidad = {required:true};
                            errores = true;
                        }else if($scope.ingreso.cantidad < 0){
                            $scope.validacion.cantidad = {min:true};
                            errores = true;
                        }else if($scope.ingreso.cantidad > ($scope.insumo.cantidad_validada - $scope.insumo.cantidad_recibida)){
                            $scope.validacion.cantidad = {max:true};
                            errores = true;
                        }

                        if(errores){
                            return false;
                        }

                        if(!$scope.lista_ingresos[$scope.insumo.insumo_id]){
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
                            $scope.siguiente();
                            var element = $window.document.getElementById('ingreso_lote');
                            element.focus();
                        }
                    };
                },
                templateUrl: 'src/pedidos/views/recepcion-insumo.html',
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
                console.log('cancelado');
            });
        };

        $scope.finalizarEntrega = function(ev){
            var confirm = $mdDialog.confirm()
                .title('Finalizar entrega?')
                .content('La entrega se cerrará y ya no podrá editarse.')
                .targetEvent(ev)
                .ok('Finalizar')
                .cancel('Cancelar');
            $mdDialog.show(confirm).then(function() {
                $scope.recepcion.estatus = 2;
                $scope.guardarEntrega();
            }, function() {});
        }

        $scope.guardarEntrega = function(){
            $scope.cargando = true;
            $scope.validacion = {};
            var entrega = $scope.recepcion;
            entrega.hora_entrega = $filter('date')(entrega.hora_entrega_date,'HH:mm:ss');
            entrega.acta_id = $scope.acta.id;
            entrega.lista_insumos_requisicion = $scope.lista_insumos_requisicion;
            entrega.ingresos_requisicion = {};
            for(var i in $scope.ingresos_requisicion){
                var ingresos = $scope.ingresos_requisicion[i];
                entrega.ingresos_requisicion[i] = $scope.ingresos_requisicion[i][$scope.recepcion.proveedor_id];
            }

            PedidosDataApi.guardarEntrega(entrega,function(res){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos guardados con éxito.'});
                $scope.recepcion.estatus = res.data.estatus;
                $scope.recepcion.id = res.data.id;
                $scope.cargando = false;
            },function(e){
                $scope.cargando = false;
                if($scope.recepcion.estatus == 2){
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
            $scope.reportes_imprimir = [];
            
            if($scope.aplicar_proveedor.id){
                $scope.recepcionIniciada = true;
                $scope.lista_insumos_requisicion = {1:[],2:[],3:[],4:[]};

                for(var i in $scope.acta.requisiciones){
                    var requisicion = $scope.acta.requisiciones[i];
                    if(requisicion.insumos_proveedor[$scope.aplicar_proveedor.id]){
                        $scope.lista_insumos_requisicion[requisicion.tipo_requisicion] = requisicion.insumos_proveedor[$scope.aplicar_proveedor.id];
                    }
                }
                if($scope.entregas_guardadas[$scope.aplicar_proveedor.id]){
                    $scope.recepcion = $scope.entregas_guardadas[$scope.aplicar_proveedor.id];
                }else{
                    $scope.recepcion.proveedor_id = $scope.aplicar_proveedor.id;
                }

                if($scope.entregas_imprimir[$scope.aplicar_proveedor.id]){
                    $scope.reportes_imprimir = $scope.entregas_imprimir[$scope.aplicar_proveedor.id];
                }
                //console.log($scope.lista_insumos_requisicion);
            }else{
                $scope.recepcionIniciada = false;
                $scope.lista_insumos_requisicion = {1:[],2:[],3:[],4:[]};
                for(var i in $scope.acta.requisiciones){
                    var requisicion = $scope.acta.requisiciones[i];
                    $scope.lista_insumos_requisicion[requisicion.tipo_requisicion] = requisicion.insumos;
                }
                $scope.recepcion.proveedor_id = undefined;
            }
        };

        $scope.imprimirOficio = function(){
            window.open(URLS.BASE_API +'/oficio-pdf/'+$routeParams.id);
        }

        $scope.sincronizar = function(){
            $scope.cargando = true;
            PedidosDataApi.sincronizar($scope.recepcion.id,function(res){
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