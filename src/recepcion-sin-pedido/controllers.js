(function(){
	'use strict';
    angular.module('RecepcionLibreModule')
    .controller('RecepcionLibreCtrl',
    ['$rootScope', '$scope', 'RecepcionLibreDataApi', '$mdSidenav','$location','$http','URLS','$timeout','$mdBottomSheet','Auth','Menu','UsuarioData','$mdMedia','$mdDialog','$document','Mensajero', 
    function($rootScope, $scope, RecepcionLibreDataApi,$mdSidenav,$location,$http,URLS,$timeout,$mdBottomSheet,Auth, Menu, UsuarioData,$mdMedia,$mdDialog,$document,Mensajero){
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

        $scope.entradasInfinitas = {
          numLoaded_: 0,
          toLoad_: 0,
          entradas: [],
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
            return this.entradas[index];
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
                parametros.pagina = ((this.entradas.length)/50) + 1;
                if($scope.textoBuscado){
                    parametros.query = $scope.textoBuscado;
                }

                RecepcionLibreDataApi.lista(parametros,function (res) {
                    if($scope.entradasInfinitas.maxItems != res.totales){
                        $scope.entradasInfinitas.maxItems = res.totales;
                    }
                    
                    for (var i = 0; i < res.data.length; i++){
                        var obj = {
                            id: res.data[i].id,
                            folio: res.data[i].folio,
                            icono: 'file-outline',
                            fecha: new Date(res.data[i].fecha_recibe + ' ' + res.data[i].hora_recibe),
                            estatus: res.data[i].estatus,
                            proveedor: res.data[i].proveedor.nombre,
                            total_recibido: res.data[i].total,
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
                        
                        $scope.entradasInfinitas.entradas.push(obj);
                        $scope.entradasInfinitas.numLoaded_++;
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
                    $scope.entradasInfinitas.maxItems = 0;
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
    .controller('FormRecepcionLibreCtrl',
    ['$rootScope', '$scope', 'RecepcionLibreDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage','$timeout',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','$window','Mensajero','ImprimirEntrada',
    function(
    $rootScope, $scope, RecepcionLibreDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,$timeout,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,$window,Mensajero,ImprimirEntrada
    ){
        $scope.menuSelected = "/recepcion-sin-pedido";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;
        $scope.cargando = true;
        $scope.aplicar_proveedor = {};
        $scope.filtroTipo = 1;
        $scope.subtotales = {causes:0,no_causes:0,surfactante_causes:0,surfactante_no_causes:0,material_curacion:0,controlados:0};
        $scope.cuadro_basico = undefined;
        $scope.recepcion = {estatus:1};
        $scope.tipos_requisiciones = [
            {'clave':0, 'descripcion':'Todos'},
            {'clave':1, 'descripcion':'Causes'},
            {'clave':2, 'descripcion':'No Causes'},
            {'clave':3, 'descripcion':'Material de Curación'},
            {'clave':4, 'descripcion':'Controlados'},
            {'clave':5, 'descripcion':'Surfactantes Causes'},
            {'clave':6, 'descripcion':'Surfactantes No Causes'}
        ];
        $scope.proveedores = [];
        $scope.configuracion = {};
        
        $scope.permisoRecibir = '721A42C7F4693';

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

        if($routeParams.id){
            RecepcionLibreDataApi.ver($routeParams.id,function(res){
                //console.log(res.data);
                $scope.proveedores = res.data.proveedores;
                $scope.configuracion = res.data.configuracion;

                $scope.aplicar_proveedor.id = res.data.entrada.proveedor_id;

                $scope.recepcion = res.data.entrada;

                if($scope.recepcion.fecha_recibe){
                    $scope.recepcion.fecha_recibe = new Date($scope.recepcion.fecha_recibe + ' 00:00:00');
                }

                if($scope.recepcion.hora_recibe){
                    var horaEntrega = $scope.recepcion.hora_recibe.split(':')
                    $scope.recepcion.hora_recibe_date =  new Date(1970, 0, 1, horaEntrega[0], horaEntrega[1], 0);
                }

                if(res.data.configuracion.lista_base_id){
                    $scope.cuadro_basico = {};
                    for(var i in res.data.configuracion.cuadro_basico){
                        $scope.cuadro_basico[res.data.configuracion.cuadro_basico[i].llave] = true;
                    }
                }

                $scope.recepcion.insumos = [];
                $scope.recepcion.subtotal = 0;
                $scope.recepcion.total = 0;
                $scope.recepcion.iva = 0;

                var insumos_index = {};
                for(var i in res.data.entrada.stock){
                    var elemento = res.data.entrada.stock[i];
                    if(insumos_index[elemento.insumo_id] == undefined){
                        insumos_index[elemento.insumo_id] = $scope.recepcion.insumos.length;
                        elemento.insumo.cantidad = 0;
                        elemento.insumo.total = 0;
                        elemento.insumo.lotes = [];

                        if($scope.cuadro_basico){
                            if($scope.cuadro_basico[elemento.insumo.llave]){
                                elemento.insumo.cuadro_basico = true;
                            }else{
                                elemento.insumo.cuadro_basico = false;
                            }
                        }else{
                            elemento.insumo.cuadro_basico = true;
                        }

                        $scope.recepcion.insumos.push(elemento.insumo);
                    }
                    var insumo = $scope.recepcion.insumos[insumos_index[elemento.insumo_id]];
                    insumo.cantidad += elemento.cantidad_recibida;
                    var insumo_total = (elemento.cantidad_recibida * insumo.precio)
                    insumo.total += insumo_total;
                    insumo.lotes.push({
                        cantidad: elemento.cantidad_recibida,
                        fecha_caducidad: (elemento.fecha_caducidad)? new Date(elemento.fecha_caducidad):undefined,
                        lote: elemento.lote,
                        validacion:{}
                    });

                    if(insumo.tipo == 1 && insumo.cause == 1 && insumo.surfactante == 1){
                        $scope.recepcion.subtotal += insumo_total;
                        $scope.subtotales.surfactante_causes += insumo_total;
                    }else if(insumo.tipo == 1 && insumo.cause == 0 && insumo.surfactante == 1){
                        $scope.recepcion.subtotal += insumo_total;
                        $scope.subtotales.surfactante_no_causes += insumo_total;
                    }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 0 && insumo.surfactante == 0){
                        $scope.recepcion.subtotal += insumo_total;
                        $scope.subtotales.causes += insumo_total;
                    }else if(insumo.tipo == 1 && insumo.cause == 0){
                        $scope.recepcion.subtotal += insumo_total;
                        $scope.subtotales.no_causes += insumo_total;
                    }else if(insumo.tipo == 2 && insumo.cause == 0){
                        $scope.recepcion.subtotal += insumo_total;
                        $scope.subtotales.material_curacion += insumo_total;
                        $scope.recepcion.iva += (insumo_total*16/100);
                    }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 1 && insumo.surfactante == 0){
                        $scope.recepcion.subtotal += insumo_total;
                        $scope.subtotales.controlados += insumo_total;
                    }
                }

                $scope.recepcion.total = $scope.recepcion.iva + $scope.recepcion.subtotal;
                //var requisiciones = {};
                //var meses = {1:'Enero',2:'Febrero',3:'Marzo',4:'Abril',5:'Mayo',6:'Junio',7:'Julio',8:'Agosto',9:'Septiembre',10:'Octubre',11:'Noviembre',12:'Diciembre'};

                $scope.cargando = false;
                $scope.recepcionIniciada = true;
            },function(e){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                $scope.cargando = false;
                console.log(e);
            });
        }else{
            RecepcionLibreDataApi.cargarCatalogos(function(res){
                //console.log(res.data);
                $scope.proveedores = res.data.proveedores;
                $scope.configuracion = res.data.configuracion;

                if(res.data.configuracion.lista_base_id){
                    $scope.cuadro_basico = {};
                    for(var i in res.data.configuracion.cuadro_basico){
                        $scope.cuadro_basico[res.data.configuracion.cuadro_basico[i].llave] = true;
                    }
                }

                $scope.recepcion.insumos = [];
                $scope.recepcion.subtotal = 0;
                $scope.recepcion.total = 0;
                $scope.recepcion.iva = 0;
                //var requisiciones = {};
                //var meses = {1:'Enero',2:'Febrero',3:'Marzo',4:'Abril',5:'Mayo',6:'Junio',7:'Julio',8:'Agosto',9:'Septiembre',10:'Octubre',11:'Noviembre',12:'Diciembre'};

                $scope.cargando = false;
            },function(e){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                $scope.cargando = false;
                console.log(e);
            });
        }

        $scope.cambiarProveedor = function(){
            $scope.recepcion.estatus = 1;
            $scope.reporte_imprimir = undefined;
            
            if($scope.aplicar_proveedor.id){
                $scope.recepcionIniciada = true;

                $scope.recepcion.proveedor_id = $scope.aplicar_proveedor.id;

                var fecha_actual = new Date();
                fecha_actual = new Date(fecha_actual.getFullYear(), fecha_actual.getMonth(), fecha_actual.getDate(), fecha_actual.getHours(), fecha_actual.getMinutes(), 0);
                
                $scope.recepcion.fecha_recibe = fecha_actual;
                $scope.recepcion.hora_recibe_date = fecha_actual;

                $scope.recepcion.nombre_recibe = $scope.configuracion.encargado_almacen;
            }else{
                $scope.recepcionIniciada = false;
                $scope.recepcion.proveedor_id = undefined;
            }
        };

        $scope.agregarInsumo = function(ev){
            if($scope.recepcion.estatus < 2){
                $scope.recibirInsumo(ev);
            }
        };

        $scope.editarInsumo = function(ev,insumo){
            if($scope.recepcion.estatus < 2){
                $scope.recibirInsumo(ev,insumo);
            }else{
                $scope.mostrarDetallesInsumo(ev,insumo);
            }
        };

        $scope.recibirInsumo = function(ev,insumo) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            var locals = {
                insumo: undefined,
                index: undefined,
                recepcion: $scope.recepcion,
                cuadro_basico: $scope.cuadro_basico,
                subtotales: $scope.subtotales
            };
            if(insumo){
                locals.insumo = JSON.parse(JSON.stringify(insumo));
                locals.index = $scope.recepcion.insumos.indexOf(insumo);
            }

            $mdDialog.show({
                controller: function($scope, $mdDialog, insumo, index, recepcion, cuadro_basico, subtotales) {
                    //$scope.cargando = true;
                    //$scope.catalogo_insumos = [];
                    //var catalogo_insumos = [];
                    /*
                    ActasDataApi.insumos(function(res){
                        catalogo_insumos = res.data;
                        $scope.cargando = false;
                    },function(e){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                        console.log(e);
                    });*/
                    
                    if(insumo){
                        for(var i in insumo.lotes){
                            var lote = insumo.lotes[i];
                            if(lote.fecha_caducidad){
                                lote.fecha_caducidad = new Date(lote.fecha_caducidad);
                            }
                        }
                        $scope.insumoAutoComplete = {insumo:insumo, searchText:insumo.clave};
                        $scope.insumo = insumo;
                        $scope.index = index;
                    }else{
                        $scope.insumoAutoComplete = {};
                        $scope.insumo = undefined;
                        $scope.index = undefined;
                    }

                    $scope.validacion = {};
                    $scope.recepcion = recepcion;
                    $scope.cuadro_basico = cuadro_basico;
                    $scope.subtotales = subtotales;
                    $scope.insumos_seleccionados = {};
                    
                    for(var i in $scope.recepcion.insumos){
                        var insumo = $scope.recepcion.insumos[i];
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

                        var errores = false;
                        for(var i in $scope.insumo.lotes){
                            var lote_capturado = $scope.insumo.lotes[i];

                            lote_capturado.validacion = {};

                            /*if(!lote_capturado.lote){
                                lote_capturado.validacion.lote = {required:true};
                                errores = true;
                            }*/

                            if(lote_capturado.fecha_caducidad){
                                var hoy = new Date();
                                if(lote_capturado.fecha_caducidad < hoy){
                                    lote_capturado.validacion.fecha_caducidad = {min:true};
                                    errores = true;
                                }else{
                                    var mes_caduca = lote_capturado.fecha_caducidad.getMonth();
                                    var mes_actual = hoy.getMonth();

                                    var diferencia_meses = mes_caduca - mes_actual;

                                    if(diferencia_meses <= 3){
                                        lote_capturado.validacion.fecha_caducidad = {rojo:true};
                                        errores = true;
                                    }else if(diferencia_meses > 3 && diferencia_meses <= 6){
                                        lote_capturado.validacion.fecha_caducidad = {amarillo:true};
                                    }
                                }
                            }

                            if(!(lote_capturado.cantidad > 0)){
                                lote_capturado.validacion.cantidad = {required:true};
                                errores = true;
                            }
                        }
                        
                        if(errores){
                            return false;
                        }
                        
                        //$mdDialog.hide({insumo:$scope.insumo,index:$scope.index});
                        if($scope.index >= 0){
                            var insumo_local = $scope.recepcion.insumos[$scope.index];
                            $scope.recepcion.subtotal -= insumo_local.total;
                            if(insumo_local.tipo == 2){
                                var iva = (insumo_local.total*16/100);
                                $scope.recepcion.iva -= iva;
                            }

                            if(insumo_local.insumo_id != $scope.insumo_id){
                                console.log('          IDs diferentes: '+$scope.insumo.lote);
                                delete $scope.insumos_seleccionados[insumo_local.insumo_id];
                                $scope.insumos_seleccionados[$scope.insumo.id] = true;
                            }

                            $scope.insumo.editado = true;
                            $scope.recepcion.insumos[$scope.index] = $scope.insumo;
                            $scope.recepcion.subtotal += $scope.insumo.total;

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
                            $scope.recepcion.insumos.push($scope.insumo);

                            $scope.recepcion.subtotal += $scope.insumo.total;
                            
                            $scope.insumos_seleccionados[$scope.insumo.id] = true;

                            //Ajsutar Subtotales
                            if($scope.insumo.tipo == 1 && $scope.insumo.cause == 1 && $scope.insumo.surfactante == 1){
                                $scope.subtotales.surfactante_causes += $scope.insumo.total;
                            }else if($scope.insumo.tipo == 1 && $scope.insumo.cause == 0 && $scope.insumo.surfactante == 1){
                                $scope.subtotales.surfactante_no_causes += $scope.insumo.total;
                            }else if($scope.insumo.tipo == 1 && $scope.insumo.cause == 1 && $scope.insumo.controlado == 0){
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
                            $scope.recepcion.iva += iva;
                        }

                        $scope.recepcion.total = $scope.recepcion.iva + $scope.recepcion.subtotal;

                        $scope.insumoAutoComplete = {};
                        $scope.insumo = undefined;
                        $scope.index = undefined;

                        document.querySelector('#autocomplete-insumos').focus();
                    };

                    $scope.calcularTotal = function(){
                        $scope.insumo.total = $scope.insumo.cantidad * $scope.insumo.precio;
                    };

                    $scope.actualizarCantidad = function(){
                        $scope.insumo.cantidad = 0;
                        for(var i in $scope.insumo.lotes){
                            var lote = $scope.insumo.lotes[i];
                            $scope.insumo.cantidad += lote.cantidad;
                        }
                        $scope.calcularTotal();
                    };

                    $scope.agregarLote = function(){
                        var errores = false;
                        for(var i in $scope.insumo.lotes){
                            var lote_capturado = $scope.insumo.lotes[i];

                            lote_capturado.validacion = {};

                            if(!lote_capturado.lote){
                                lote_capturado.validacion.lote = {required:true};
                                errores = true;
                            }

                            if(!(lote_capturado.cantidad > 0)){
                                lote_capturado.validacion.cantidad = {required:true};
                                errores = true;
                            }
                        }

                        if(!errores){
                            $scope.insumo.lotes.push({});
                            $timeout(function(){
                                var ultimo_lote = $scope.insumo.lotes.length-1;
                                var element = $window.document.getElementById('ingreso_cantidad_'+ultimo_lote);
                                element.focus();
                            },200);
                        }
                    };

                    $scope.quitarLote = function(index){
                        $scope.insumo.lotes.splice(index,1);
                        $scope.actualizarCantidad();
                    };

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
                                $scope.insumo.inventario_actual = $scope.insumoAutoComplete.insumo.inventario_actual;
                                $scope.insumo.total = 0.00;
                                $scope.insumo.cantidad = 0;
                                $scope.insumo.lotes = [{}];

                                $timeout(function(){
                                    var element = $window.document.getElementById('ingreso_cantidad_0');
                                    element.focus();
                                },200);
                                
                                /*$timeout(function(){
                                    var element = $window.document.getElementById('input_cantidad');
                                    element.focus();
                                },200);*/
                            }
                        }else{
                            $scope.insumo = undefined;
                        }
                    };

                    $scope.querySearchInsumo = function(query) {
                        return $http.get(URLS.BASE_API + '/insumos',{ params:{ query: query }})
                            .then(function(res){
                                var valor_default = 0;
                                var cuadro_basico = {};

                                if(!$scope.cuadro_basico){
                                    valor_default = 1;
                                }else{
                                    cuadro_basico = $scope.cuadro_basico;
                                }

                                for(var i in res.data.data){
                                    res.data.data[i].cuadro_basico = valor_default;
                                    if(cuadro_basico[res.data.data[i].llave]){
                                        res.data.data[i].cuadro_basico = 1;
                                    }
                                    if(res.data.data[i].inventario){
                                        var meses = {1:'Enero',2:'Febrero',3:'Marzo',4:'Abril',5:'Mayo',6:'Junio',7:'Julio',8:'Agosto',9:'Septiembre',10:'Octubre',11:'Noviembre',12:'Diciembre'};
                                        for(var m = 1; m <= 12; m++){
                                            if(res.data.data[i].inventario[m]){
                                                res.data.data[i].inventario_actual = {
                                                    mes:meses[m],
                                                    anio:res.data.data[i].inventario.anio,
                                                    fecha:new Date(res.data.data[i].inventario.fecha_actualizo),
                                                    cantidad:res.data.data[i].inventario[m]
                                                };
                                            }
                                        }
                                    }
                                }
                                
                                return res.data.data;
                            });
                    };
                    /*
                    $scope.querySearchInsumo = function(query){
                        var results = query ? catalogo_insumos.filter( createFilterFor(query,['clave','descripcion','lote'])) : catalogo_insumos;
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
                    };*/
                    
                },
                templateUrl: 'src/recepcion-sin-pedido/views/form-insumo.html',
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

        $scope.eliminarInsumo = function(insumo){
            //var insumo_local = $scope.acta.insumos[index];
            var insumo_local = insumo;
            $scope.recepcion.subtotal -= insumo_local.total;
            if(insumo_local.tipo == 2){
                var iva = (insumo_local.total*16/100);
                $scope.recepcion.iva -= iva;
            }

            if(insumo.tipo == 1 && insumo.cause == 1 && insumo.surfactante == 1){
                $scope.subtotales.surfactante_causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 0 && insumo.surfactante == 1){
                $scope.subtotales.surfactante_no_causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 0){
                $scope.subtotales.causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 0){
                $scope.subtotales.no_causes -= insumo.total;
            }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 1){
                $scope.subtotales.controlados -= insumo.total;
            }else{
                $scope.subtotales.material_curacion -= (insumo.total+(insumo.total*16/100));
            }

            var index = $scope.recepcion.insumos.indexOf(insumo);
            $scope.recepcion.insumos.splice(index,1);
            $scope.recepcion.total = $scope.recepcion.iva + $scope.recepcion.subtotal;
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
            $scope.recepcion.subtotal = 0;
            $scope.recepcion.iva = 0;
            $scope.recepcion.total = 0;
            
            for(var i in $scope.recepcion.insumos){
                var insumo = $scope.recepcion.insumos[i];
                if(tipo === 0){
                    $scope.recepcion.subtotal += insumo.total;
                    if(insumo.tipo == 2 && insumo.cause == 0){
                        $scope.recepcion.iva += (insumo.total*16/100);
                    }
                }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.surfactante == 1 && tipo == 5){
                    $scope.recepcion.subtotal += insumo.total;
                }else if(insumo.tipo == 1 && insumo.cause == 0 && insumo.surfactante == 1 && tipo == 6){
                    $scope.recepcion.subtotal += insumo.total;
                }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 0 && insumo.surfactante == 0 && tipo == 1){
                    $scope.recepcion.subtotal += insumo.total;
                }else if(insumo.tipo == 1 && insumo.cause == 0 && tipo == 2){
                    $scope.recepcion.subtotal += insumo.total;
                }else if(insumo.tipo == 2 && insumo.cause == 0 && tipo == 3){
                    $scope.recepcion.subtotal += insumo.total;
                    $scope.recepcion.iva += (insumo.total*16/100);
                }else if(insumo.tipo == 1 && insumo.cause == 1 && insumo.controlado == 1 && insumo.surfactante == 0 && tipo == 4){
                    $scope.recepcion.subtotal += insumo.total;
                }
            }
            $scope.recepcion.total = $scope.recepcion.iva + $scope.recepcion.subtotal;
        };

        var prepararGuardado = function(){
            var entrega = $scope.recepcion;
            entrega.hora_recibe = $filter('date')(entrega.hora_recibe_date,'HH:mm:ss');
            
            return entrega;
        };

        $scope.guardarEntrega = function(){
            $scope.cargando = true;
            $scope.validacion = {};
            
            var entrega = prepararGuardado();

            if($routeParams.id){
                RecepcionLibreDataApi.editarEntrega($routeParams.id,entrega,function(res){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos guardados con éxito.'});
                    //$scope.recepcion.estatus = res.data.estatus;
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
            }else{
                RecepcionLibreDataApi.guardarEntrega(entrega,function(res){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos guardados con éxito.'});
                    $scope.recepcion.estatus = res.data.estatus;
                    $scope.recepcion.id = res.data.id;
                    
                    $location.path('recepcion-sin-pedido/'+res.data.id+'/entrada');

                    //$scope.cargando = false;
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
            }
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