(function(){
	'use strict';
    angular.module('RecetasModule')
    .controller('RecetasCtrl',
    ['$rootScope', '$scope', 'RecetasDataApi', '$mdSidenav','$location','$document','$mdBottomSheet','$routeParams','$filter','$localStorage',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero','$timeout','$window',
    function(
    $rootScope, $scope, RecetasDataApi,$mdSidenav,$location,$document,$mdBottomSheet,$routeParams,$filter,$localStorage,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero,$timeout,$window
    ){

        $scope.menuSelected = "/recetas";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;
        $scope.filtroTipo = 1;
        $scope.usuario_id = $scope.loggedUser.id;

        $scope.permisoAgregar = '648229AF845F8';
        $scope.permisoEliminar = '648229AF845F8';

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

        $scope.crearReceta = function(){
            if(!$scope.recetaNueva){
                $scope.ir('recetas/nuevo');
            }else{
                $scope.ir('recetas/'+$scope.recetaNueva+'/editar');
            }
        }

        $scope.recetasInfinitas = {
            numLoaded_: 0,
            toLoad_: 0,
            recetas: [],
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
                return this.recetas[index];
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
                    var parametros = {};
                    parametros.pagina = ((this.recetas.length)/50) + 1;
                    if($scope.textoBuscado){
                        parametros.query = $scope.textoBuscado;
                    }


                RecetasDataApi.lista(parametros,function (res) {
                console.log(res);
                 if($scope.recetasInfinitas.maxItems != res.totales){
                 $scope.recetasInfinitas.maxItems = res.totales;
                 }


                 //$scope.cargandoLista = false;
                        $scope.cargando = false;

                        for (var i = 0; i < res.data.length; i++){

                            var obj = {
                                id: res.data[i].id,
                                folio: res.data[i].receta.folio_interno,
                                paciente: res.data[i].receta.paciente,
                                cantidad: res.data[i].receta.receta_detalle.length,
                                fecha: res.data[i].receta.created_at

                            };

                            //var total = 0;
                            //var surtido = 0;
                            /*for (var j = 0; j < res.data[i].salida_detalle.length; j++){
                                obj.cantidad = obj.cantidad + res.data[i].salida_detalle[j].cantidad_surtido;
                                surtido = surtido + parseInt(res.data[i].salida_detalle[j].cantidad_surtido);
                                total = total + parseInt(res.data[i].salida_detalle[j].cantidad_surtido) + parseInt(res.data[i].salida_detalle[j].cantidad_no_surtido);
                            }
                            var percent_salida = parseFloat((obj.cantidad / total));
                            if(!parseFloat(percent_salida))
                                percent_salida = 0.00;
                            obj.cantidad = obj.cantidad +"/"+total+" ("+percent_salida.toFixed(2)+"% ) ";
                            */
                            if(res.data[i].estatus == 1){
                                $scope.recetaNueva = res.data[i].id;
                            }else if(res.data[i].estatus == 2){
                                obj.icono = 'file-lock';
                            }

                            $scope.recetasInfinitas.recetas.push(obj);
                            $scope.recetasInfinitas.numLoaded_++;
                            $scope.cargandoLista = false;
                        }



                    }, function (e, status) {
                        if(status == 403){
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para listar estos elementos.'});
                        }else{
                            Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar listar los elementos.'});
                        }
                        $scope.recetasInfinitas.maxItems = 0;
                        $scope.cargandoLista = false;
                        $scope.cargando = false;

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
    .controller('FormRecetasCtrl',
        ['$rootScope', '$scope', 'RecetasDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage',
            '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero','$window','ImprimirSolicitud',
            function(
                $rootScope, $scope, RecetasDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,
                $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero, $window, ImprimirSolicitud)
            {
                $scope.menuSelected = "/recetas";
                $scope.menu = Menu.getMenu();
                $scope.menuIsOpen = false;
                $scope.loggedUser = UsuarioData.getDatosUsuario();
                $scope.toggleDatosReceta = true;

                $scope.captura_habilitada = 1;
                $scope.autorizaAutoComplete = {searchText:[], autoriza:""};
                $scope.recibeAutoComplete = {searchText:[], recibe:""};
                $scope.responsableAutoComplete = {searchText:[], responsable:{}};
                $scope.receta = {};
                $scope.insumos_seleccionados = [];
                $scope.lista_insumos = [];
                $scope.captura_receta = true;

                $scope.permisoGuardar =  '648229AF845F8';

                //Modulo de realiza

                if($routeParams.id){
                    $scope.captura_receta = false;
                    $scope.imprimir_receta = true;

                    RecetasDataApi.ver($routeParams.id,function(res){

                        for(var i in res.data.receta.receta_detalle){

                                res.data.receta.receta_detalle[i].insumo.cantidad = res.data.receta.receta_detalle[i].cantidad;
                                res.data.receta.receta_detalle[i].insumo.frecuencia = res.data.receta.receta_detalle[i].frecuencia;
                                res.data.receta.receta_detalle[i].insumo.dias = res.data.receta.receta_detalle[i].duracion;

                                for(var j in res.data.salida_detalle){
                                    if(res.data.salida_detalle[j].insumo_id == res.data.receta.receta_detalle[i].insumo.id)
                                    {
                                        res.data.receta.receta_detalle[i].insumo.unidades = res.data.salida_detalle[j].cantidad_solicitada;
                                    }
                                }
                                $scope.recibeAutoComplete.searchText = res.data.recibe;
                                $scope.autorizaAutoComplete.searchText = res.data.autoriza;
                                $scope.responsableAutoComplete.searchText = res.data.realiza;
                                $scope.diagnostico = res.data.receta.diagnostico;
                                $scope.folio = res.data.receta.folio_interno;

                                if(res.data.receta.receta_detalle[i].duplicar_dosis == 0)
                                    res.data.receta.receta_detalle[i].insumo.duplicar_dosis = false;
                                else
                                    res.data.receta.receta_detalle[i].insumo.duplicar_dosis = true;


                                $scope.lista_insumos.push(res.data.receta.receta_detalle[i].insumo);

                        }

                    },function(e){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                        console.log(e);
                    });
                }
                    $scope.querySearchautoriza = function(query, tipo) {

                    return $http.get(URLS.BASE_API + '/personal',{ params:{ query: query, filtro:tipo}})
                     .then(function(res){

                        return res.data.data;
                     });
                };

                $scope.querySearchresponsable = function(query, tipo) {

                    return $http.get(URLS.BASE_API + '/personal',{ params:{ query: query, filtro:tipo}})
                        .then(function(res){

                            return res.data.data;
                        });
                };
                $scope.querySearchrecibe = function(query, tipo) {

                    return $http.get(URLS.BASE_API + '/personal',{ params:{ query: query, filtro:tipo}})
                        .then(function(res){

                            return res.data.data;
                        });
                };
                //Fin Realiza
                //Editar Insumo
                $scope.editarInsumo = function(ev,insumo) {
                    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;

                    var locals = {
                        insumo: undefined,
                        index: undefined,
                        cuadro_basico: $scope.cuadro_basico,
                        lista_insumos: $scope.lista_insumos
                    };
                    if(insumo){
                        locals.insumo = JSON.parse(JSON.stringify(insumo));
                        locals.index = $scope.lista_insumos.indexOf(insumo);
                    }
                    $mdDialog.show({
                        controller: function($scope, $mdDialog, insumo, index, cuadro_basico, lista_insumos) {
                            $scope.insumos_seleccionados = {};

                            $scope.lista_insumos = lista_insumos;

                            if(insumo){
                                $scope.insumoAutoComplete = {insumo:insumo, searchText:insumo.clave};
                                $scope.insumo = insumo;
                                $scope.index = index;

                            }else{
                                $scope.insumoAutoComplete = {};
                                $scope.insumo = undefined;
                                $scope.index = undefined;

                            }

                            for(var i in $scope.lista_insumos){
                                var insumo = $scope.lista_insumos[i];
                                $scope.insumos_seleccionados[insumo.insumo_id] = true;
                            }
                            $scope.cancel = function() {
                                $mdDialog.cancel();
                            };
                            $scope.answer = function() {
                                var error = 0;
                                $scope.validacion = {};
                                if(!$scope.insumo.cantidad){
                                    $scope.validacion.cantidad = {'required':true};
                                    error++;
                                }

                                if($scope.insumo.cantidad <= 0){
                                    $scope.validacion.cantidad = {min:true};
                                    error++;
                                }

                                if(!$scope.insumo.frecuencia){
                                    $scope.validacion.frecuencia = {'required':true};
                                    $scope.validacion.frecuencia = {min:true};
                                    error++;
                                }
                                if(!$scope.insumo.dias){
                                    $scope.validacion.dias = {'required':true};
                                    $scope.validacion.dias = {min:true};
                                    error++;
                                }

                                if(error > 0)
                                {
                                    return false;
                                }else{
                                    lista_insumos[$scope.index] = $scope.insumo;
                                    $scope.insumos_seleccionados[$scope.insumo.id] = true;
                                    $scope.insumoAutoComplete = {};
                                    $scope.insumo = undefined;
                                    $scope.index = undefined;


                                    document.querySelector('#autocomplete-insumos').focus();
                                    $mdDialog.cancel();
                                }
                            };
                            $scope.calcularTotal = function(){
                                if(parseFloat($scope.insumo.cantidad) && parseFloat($scope.insumo.cantidad)>0)
                                    if(parseFloat($scope.insumo.dias) && parseFloat($scope.insumo.dias)>0)
                                        if(parseFloat($scope.insumo.frecuencia) && parseFloat($scope.insumo.frecuencia)>0){

                                            var cantidad_dosis = parseFloat($scope.insumo.cantidad);
                                            if($scope.insumo.presentacion_id == 15)
                                            {
                                                if($scope.insumo.duplicar_dosis)
                                                {
                                                    cantidad_dosis = parseFloat((cantidad_dosis * 2));
                                                }
                                            }


                                            $scope.insumo.unidades = Math.ceil((((cantidad_dosis * parseFloat($scope.insumo.cantidad_unidad))) * parseFloat(24 / parseFloat($scope.insumo.frecuencia)) * parseFloat($scope.insumo.dias)) / parseFloat($scope.insumo.cantidad_presentacion));
                                        }
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
                                        //$scope.insumo.lote = $scope.insumoAutoComplete.insumo.lote;
                                        $scope.insumo.unidad = $scope.insumoAutoComplete.insumo.unidad;
                                        //$scope.insumo.precio = $scope.insumoAutoComplete.insumo.precio;
                                        $scope.insumo.tipo = $scope.insumoAutoComplete.insumo.tipo;
                                        $scope.insumo.cause = $scope.insumoAutoComplete.insumo.cause;
                                        $scope.insumo.controlado = $scope.insumoAutoComplete.insumo.controlado;
                                        $scope.insumo.surfactante = $scope.insumoAutoComplete.insumo.surfactante;
                                        $scope.insumo.pedido = $scope.insumoAutoComplete.insumo.pedido;
                                        $scope.insumo.cuadro_basico = $scope.insumoAutoComplete.insumo.cuadro_basico;
                                        $scope.insumo.sustancia_id = $scope.insumoAutoComplete.insumo.sustancia_id;
                                        $scope.insumo.presentacion_id = $scope.insumoAutoComplete.insumo.presentacion_id;
                                        $scope.insumo.unidad_medida_id = $scope.insumoAutoComplete.insumo.unidad_medida_id;
                                        $scope.insumo.familia_id = $scope.insumoAutoComplete.insumo.familia_id;
                                        $scope.insumo.es_unidosis = $scope.insumoAutoComplete.insumo.es_unidosis;
                                        $scope.insumo.tipo_sustancia = $scope.insumoAutoComplete.insumo.tipo_sustancia;
                                        $scope.insumo.cantidad_unidad = $scope.insumoAutoComplete.insumo.cantidad_unidad;
                                        $scope.insumo.cantidad_presentacion = $scope.insumoAutoComplete.insumo.cantidad_presentacion;
                                        $scope.insumo.duplicar_dosis = false;
                                        $scope.insumo.cantidad = 0;
                                        $scope.insumo.frecuencia = 0;
                                        $scope.insumo.dias = 0;
                                        $scope.insumo.unidades = 0;

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
                                        }

                                        return res.data.data;
                                    });
                            };


                        },
                        templateUrl: 'src/recetas/views/form-insumo.html',
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
                    //Fin editar insumo
                //Agregar insumos
                $scope.agregarInsumo = function(ev,insumo) {
                    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;

                    var locals = {
                        insumo: undefined,
                        index: undefined,
                        cuadro_basico: $scope.cuadro_basico,
                        lista_insumos: $scope.lista_insumos
                    };
                    if(insumo){
                        locals.insumo = JSON.parse(JSON.stringify(insumo));
                        locals.index = $scope.insumos.indexOf(insumo);
                    }



                    $mdDialog.show({
                        controller: function($scope, $mdDialog, insumo, index, cuadro_basico, lista_insumos) {
                            $scope.insumos_seleccionados = {};
                            $scope.lista_insumos = lista_insumos;

                            if(insumo){
                                $scope.insumoAutoComplete = {insumo:insumo, searchText:insumo.clave};
                                $scope.insumo = insumo;
                                $scope.index = index;

                            }else{
                                $scope.insumoAutoComplete = {};
                                $scope.insumo = undefined;
                                $scope.index = undefined;

                            }

                            for(var i in $scope.lista_insumos){
                                var insumo = $scope.lista_insumos[i];
                                $scope.insumos_seleccionados[insumo.insumo_id] = true;
                            }

                            $scope.cancel = function() {
                                $mdDialog.cancel();
                            };
                            $scope.answer = function() {
                                var error = 0;
                                $scope.validacion = {};
                                if(!$scope.insumo.cantidad){
                                    $scope.validacion.cantidad = {'required':true};
                                    error++;
                                }

                                if($scope.insumo.cantidad <= 0){
                                    $scope.validacion.cantidad = {min:true};
                                    error++;
                                }

                                if(!$scope.insumo.frecuencia){
                                    $scope.validacion.frecuencia = {'required':true};
                                    $scope.validacion.frecuencia = {min:true};
                                    error++;
                                }
                                if(!$scope.insumo.dias){
                                    $scope.validacion.dias = {'required':true};
                                    $scope.validacion.dias = {min:true};
                                    error++;
                                }

                                if(error > 0)
                                {
                                    return false;
                                }else{
                                    lista_insumos.push($scope.insumo);
                                    $scope.insumos_seleccionados[$scope.insumo.id] = true;
                                    $scope.insumoAutoComplete = {};
                                    $scope.insumo = undefined;
                                    $scope.index = undefined;

                                    document.querySelector('#autocomplete-insumos').focus();
                                }
                            };
                            $scope.calcularTotal = function(){
                                if(parseFloat($scope.insumo.cantidad) && parseFloat($scope.insumo.cantidad)>0)
                                    if(parseFloat($scope.insumo.dias) && parseFloat($scope.insumo.dias)>0)
                                        if(parseFloat($scope.insumo.frecuencia) && parseFloat($scope.insumo.frecuencia)>0){

                                            var cantidad_dosis = parseFloat($scope.insumo.cantidad);
                                            if($scope.insumo.presentacion_id == 15)
                                            {
                                                if($scope.insumo.duplicar_dosis)
                                                {
                                                    cantidad_dosis = parseFloat((cantidad_dosis * 2));
                                                }
                                            }


                                            $scope.insumo.unidades = Math.ceil((((cantidad_dosis * parseFloat($scope.insumo.cantidad_unidad))) * parseFloat(24 / parseFloat($scope.insumo.frecuencia)) * parseFloat($scope.insumo.dias)) / parseFloat($scope.insumo.cantidad_presentacion));
                                        }
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
                                        //$scope.insumo.lote = $scope.insumoAutoComplete.insumo.lote;
                                        $scope.insumo.unidad = $scope.insumoAutoComplete.insumo.unidad;
                                        //$scope.insumo.precio = $scope.insumoAutoComplete.insumo.precio;
                                        $scope.insumo.tipo = $scope.insumoAutoComplete.insumo.tipo;
                                        $scope.insumo.cause = $scope.insumoAutoComplete.insumo.cause;
                                        $scope.insumo.controlado = $scope.insumoAutoComplete.insumo.controlado;
                                        $scope.insumo.surfactante = $scope.insumoAutoComplete.insumo.surfactante;
                                        $scope.insumo.pedido = $scope.insumoAutoComplete.insumo.pedido;
                                        $scope.insumo.cuadro_basico = $scope.insumoAutoComplete.insumo.cuadro_basico;
                                        $scope.insumo.sustancia_id = $scope.insumoAutoComplete.insumo.sustancia_id;
                                        $scope.insumo.presentacion_id = $scope.insumoAutoComplete.insumo.presentacion_id;
                                        $scope.insumo.unidad_medida_id = $scope.insumoAutoComplete.insumo.unidad_medida_id;
                                        $scope.insumo.familia_id = $scope.insumoAutoComplete.insumo.familia_id;
                                        $scope.insumo.es_unidosis = $scope.insumoAutoComplete.insumo.es_unidosis;
                                        $scope.insumo.tipo_sustancia = $scope.insumoAutoComplete.insumo.tipo_sustancia;
                                        $scope.insumo.cantidad_unidad = $scope.insumoAutoComplete.insumo.cantidad_unidad;
                                        $scope.insumo.cantidad_presentacion = $scope.insumoAutoComplete.insumo.cantidad_presentacion;
                                        $scope.insumo.duplicar_dosis = false;
                                        $scope.insumo.cantidad = 0;
                                        $scope.insumo.frecuencia = 0;
                                        $scope.insumo.dias = 0;
                                        $scope.insumo.unidades = 0;

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
                                        }

                                        return res.data.data;
                                    });
                            };


                        },
                        templateUrl: 'src/recetas/views/form-insumo.html',
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
                //Fin insumos
                $scope.eliminarInsumo = function(ev, insumo)
                {
                    var confirm = $mdDialog.confirm()
                        .title('Aviso')
                        .textContent('¿Desea eliminar el insumo?')
                        .ariaLabel('Eliminar')
                        .targetEvent(ev)
                        .ok('Aceptar')
                        .cancel('Cancelar');
                    $mdDialog.show(confirm).then(function() {
                        var indice = 0;
                        for(var i in $scope.lista_insumos){
                            if($scope.lista_insumos[i].id == insumo.id)
                            {
                                $scope.lista_insumos.splice(indice, 1);
                            }
                            indice++;
                        }
                    }, function() {});


                };

                $scope.crearReceta = function(ev)
                {
                    var error = 0;
                    console.log($scope);
                    $scope.validacion = {};

                    if($scope.lista_insumos.length == 0){
                        $scope.validacion.receta = {'required':true};
                        error++;
                    }

                    if(!$scope.autorizaAutoComplete || $scope.autorizaAutoComplete.searchText.length < 10){
                        $scope.validacion.autoriza = true;
                        error++;
                    }
                    if(!$scope.responsableAutoComplete || $scope.responsableAutoComplete.searchText.length < 10){
                        $scope.validacion.responsable = {'required':true};
                        error++;
                    }
                    if(!$scope.recibeAutoComplete || $scope.recibeAutoComplete.searchText.length < 10){
                        $scope.validacion.recibe = {'required':true};
                        error++;
                    }
                    if(error>0)
                        return false;
                    else{

                        //$scope.cargando = true;
                        var parametros = {"autoriza": $scope.autorizaAutoComplete.searchText, "responsable": $scope.responsableAutoComplete.searchText, "recibe": $scope.recibeAutoComplete.searchText, "diagnostico": $scope.diagnostico, "insumos": $scope.lista_insumos};
                        RecetasDataApi.guardar(parametros,function (res) {

                            $location.path('recetas/'+res.data.id+'/editar');
                        }, function (e) {
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
            }]);
;
})();