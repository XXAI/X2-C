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
                            folio: res.data[i].folio,
                            fecha: new Date(res.data[i].fecha + ' 00:00:00'),
                            estatus: res.data[i].estatus
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
            $scope.textoBuscado = $scope.textoBusqueda;
            $mdSidenav('busqueda-filtro').close();
            
            $scope.actasInfinitas.numLoaded_ = 0;
            $scope.actasInfinitas.toLoad_ = 0;
            $scope.actasInfinitas.actas = [];
            $scope.actasInfinitas.maxItems = 1;
        };

        $scope.eliminarActa = function(acta,ev){
            var confirm = $mdDialog.confirm()
                .title('Eliminar acta?')
                .content('¿Esta seguro de eliminar esta acta?')
                .targetEvent(ev)
                .ok('Eliminar')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                $scope.cargando = true;
                ActasDataApi.eliminar(acta.id,function (res){
                    var index = $scope.actasInfinitas.actas.indexOf(acta);
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
    }])
    .controller('FormActaCtrl',
    ['$rootScope', '$scope', 'ActasDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero',
    function(
    $rootScope, $scope, ActasDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero
    ){
        $scope.menuSelected = "/actas";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;

        $scope.cargando = true;

        if($routeParams.id){
            ActasDataApi.ver($routeParams.id,function(res){
                $scope.acta = res.data;

                if($scope.acta.fecha){
                    $scope.acta.fecha = new Date(res.data.fecha);
                }

                if($scope.acta.hora_inicio){
                    var horaInicio = $scope.acta.hora_inicio.split(':')
                    $scope.acta.hora_inicio_date =  new Date(1970, 0, 1, horaInicio[0], horaInicio[1], 0);
                }

                if($scope.acta.hora_termino){
                    var horaTermino = $scope.acta.hora_termino.split(':')
                    $scope.acta.hora_termino_date =  new Date(1970, 0, 1, horaTermino[0], horaTermino[1], 0);
                }

                $scope.acta.insumos = [];
                $scope.acta.subtotal = 0;
                $scope.acta.total = 0;
                var requisiciones = {};
                if(res.data.requisiciones.length){
                    for(var i in res.data.requisiciones){
                        var requisicion = res.data.requisiciones[i];
                        requisiciones[requisicion.tipo_requisicion] = {
                            id: requisicion.id,
                            lotes:requisicion.lotes,
                            pedido: requisicion.pedido,
                            tipo_requisicion: requisicion.tipo_requisicion,
                            dias_surtimiento: requisicion.dias_surtimiento,
                            sub_total: 0,
                            gran_total: 0,
                            iva: 0,
                            insumos: []
                        }

                        $scope.acta.firma_director = requisicion.firma_director;
                        $scope.acta.firma_solicita = requisicion.firma_solicita;

                        $scope.acta.iva = requisicion.iva;

                        for(var j in requisicion.insumos){

                            var insumo = {};
                            
                            insumo.descripcion = requisicion.insumos[j].descripcion;
                            insumo.clave = requisicion.insumos[j].clave;
                            insumo.lote = requisicion.insumos[j].lote;
                            insumo.unidad = requisicion.insumos[j].unidad;
                            insumo.tipo = requisicion.insumos[j].tipo;
                            insumo.cause = requisicion.insumos[j].cause;
                            insumo.precio = requisicion.insumos[j].precio;
                            insumo.pedido = requisicion.insumos[j].pedido;

                            insumo.insumo_id = requisicion.insumos[j].id;
                            insumo.cantidad = requisicion.insumos[j].pivot.cantidad;
                            insumo.total = parseFloat(requisicion.insumos[j].pivot.total);
                            insumo.requisicion_id = requisicion.insumos[j].pivot.requisicion_id;
                            
                            $scope.acta.subtotal += insumo.total;

                            $scope.acta.insumos.push(insumo);
                        }
                        //$scope.acta.insumos += requisicion.insumos;
                    }
                }

                if(parseFloat($scope.acta.iva) == 0){
                    $scope.acta.iva = undefined;
                }
                if($scope.acta.iva){
                    //
                }else{
                    $scope.acta.total = $scope.acta.subtotal;
                }
                res.data.requisiciones = requisiciones;
                $scope.cargando = false;
            },function(e){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                console.log(e);
            });
        }else{
            $scope.acta = {total:0.00,subtotal:0.00,requisiciones:{},insumos:[]};
            $scope.cargando = false;
        }

        $scope.agregarInsumo = function(ev){
            $scope.mostrarDialogo(ev);
        };
        $scope.editarInsumo = function(ev,index){
            $scope.mostrarDialogo(ev,index);
        };
        $scope.eliminarInsumo = function(index){
            var insumo_local = $scope.acta.insumos[index];
            $scope.acta.subtotal -= insumo_local.total;
            $scope.acta.insumos.splice(index,1);
            if($scope.acta.iva){
                //
            }else{
                $scope.acta.total = $scope.acta.subtotal;
            }
        };
        $scope.mostrarDialogo = function(ev,index) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            var locals = {insumo:undefined,index:undefined};
            if(index >= 0){
                locals.insumo = JSON.parse(JSON.stringify($scope.acta.insumos[index]));;
                locals.index = index;
            }

            $mdDialog.show({
                controller: function($scope, $mdDialog, insumo, index) {
                    if(insumo){
                        $scope.insumoAutoComplete = {insumo:insumo, searchText:insumo.clave};
                        $scope.insumo = insumo;
                        $scope.index = index;
                    }else{
                        $scope.insumoAutoComplete = {};
                        $scope.insumo = undefined;
                        $scope.index = undefined;
                    }

                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };
                    $scope.answer = function() {
                        $mdDialog.hide({insumo:$scope.insumo,index:$scope.index});
                    };

                    $scope.calcularTotal = function(){
                        $scope.insumo.total = $scope.insumo.cantidad * $scope.insumo.precio;
                    };

                    $scope.insumoAutoCompleteItemChange = function(){
                        if ($scope.insumoAutoComplete.insumo != null){
                            $scope.insumo = {};
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
                        }else{
                            $scope.insumo = undefined;
                        }
                    };

                    $scope.querySearchInsumo = function(query) {
                        return $http.get(URLS.BASE_API + '/insumos',{ params:{ query: query }})
                            .then(function(res){
                                return res.data.data;
                            });
                    };
                },
                templateUrl: 'src/actas/views/form-insumo.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: useFullScreen,
                locals:locals
            })
            .then(function(res) {
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
            }, function() {
                console.log('cancelado');
            });
            $scope.$watch(function() {
                return $mdMedia('xs') || $mdMedia('sm');
            }, function(wantsFullScreen) {
                $scope.customFullscreen = (wantsFullScreen === true);
            });
        };

        $scope.finalizarActa = function(ev){
            var confirm = $mdDialog.confirm()
                .title('Finalizar captura del acta?')
                .content('El acta se cerrará y ya no podrá editarse.')
                .targetEvent(ev)
                .ok('Finalizar')
                .cancel('Cancelar');
            $mdDialog.show(confirm).then(function() {
                $scope.acta.estatus = 2;
                $scope.guardar();
            }, function() {});
        };
        
        $scope.guardar = function() {
            $scope.cargando = true;
            var insumos = $scope.acta.insumos;

            if($scope.acta.requisiciones){
                for(var i in $scope.acta.requisiciones){
                    $scope.acta.requisiciones[i].sub_total = 0;
                    $scope.acta.requisiciones[i].gran_total = 0;
                    $scope.acta.requisiciones[i].iva = 0;
                    $scope.acta.requisiciones[i].insumos = [];
                }
            }

            for(var i in insumos){
                if(insumos[i].tipo == 1 && insumos[i].cause == 1){
                    var tipo_req = 1; //Medicamentos - causes
                }else if(insumos[i].tipo == 1 && insumos[i].cause == 0){
                    var tipo_req = 2; //Medicamentos - no causes
                }else{
                    var tipo_req = 3; //Material de curación
                }
                if(!$scope.acta.requisiciones[tipo_req]){
                    $scope.acta.requisiciones[tipo_req] = {
                        lotes:0,
                        pedido: insumos[i].pedido,
                        tipo_requisicion: tipo_req,
                        dias_surtimiento: 15,
                        sub_total: 0,
                        gran_total: 0,
                        iva: 0,
                        insumos: []
                    }
                }
                $scope.acta.requisiciones[tipo_req].sub_total += insumos[i].total;
                $scope.acta.requisiciones[tipo_req].insumos.push(insumos[i]);
            }

            if($scope.acta.requisiciones){
                var borrar_requisiciones = [];
                for(var i in $scope.acta.requisiciones){
                    var requisicion = $scope.acta.requisiciones[i];
                    if(requisicion.insumos.length){
                        requisicion.firma_director = $scope.acta.firma_director;
                        requisicion.firma_solicita = $scope.acta.firma_solicita;
                        requisicion.iva = $scope.acta.iva;
                        if($scope.acta.iva){
                            //
                        }else{
                            requisicion.gran_total = requisicion.sub_total;
                        }
                        requisicion.lotes = requisicion.insumos.length;
                    }else{
                        borrar_requisiciones.push(i);
                    }
                }
                for(var i in borrar_requisiciones){
                    delete $scope.acta.requisiciones[borrar_requisiciones[i]];
                }
            }

            $scope.acta.hora_inicio = $filter('date')($scope.acta.hora_inicio_date,'HH:mm:ss');
            $scope.acta.hora_termino = $filter('date')($scope.acta.hora_termino_date,'HH:mm:ss');

            if($routeParams.id){
                ActasDataApi.editar($scope.acta.id,$scope.acta,function (res) {
                    $scope.cargando = false;
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Acta guardada con éxito.'});
                }, function (e) {
                    $scope.cargando = false;
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                    $scope.validacion = {}; 
                    var errors = e.error;
                    for (var i in errors){
                        var error = JSON.parse('{ "' + errors[i] + '" : true }');
                        $scope.validacion[i] = error;
                    }
                });
            }else{
                ActasDataApi.crear($scope.acta,function (res) {
                    $scope.cargando = false;
                    $location.path('actas/'+res.data.id+'/editar');
                }, function (e) {
                    $scope.cargando = false;
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar guardar los datos.'});
                    $scope.validacion = {}; 
                    var errors = e.error;
                    for (var i in errors){
                        var error = JSON.parse('{ "' + errors[i] + '" : true }');
                        $scope.validacion[i] = error;
                    }
                });
            }
        };

        $scope.eliminar = function(ev) {
            var confirm = $mdDialog.confirm()
                .title('Eliminar acta?')
                .content('¿Esta seguro de eliminar esta acta?')
                .targetEvent(ev)
                .ok('Eliminar')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                $scope.cargando = true;
                ActasDataApi.eliminar($scope.acta.id,function (res){
                    $scope.cargando = false;
                    $location.path('actas');
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

        $scope.imprimir = function(){
            window.open(URLS.BASE_API +'/acta-pdf/'+$routeParams.id+'?token='+$localStorage.control_desabasto.access_token);
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