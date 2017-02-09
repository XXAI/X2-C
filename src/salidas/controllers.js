(function(){
	'use strict';
    angular.module('SalidasModule')
    .controller('SalidasCtrl',
    ['$rootScope', '$scope', 'SalidasDataApi', '$mdSidenav','$location','$http','URLS','$timeout','$mdBottomSheet','Auth','Menu','UsuarioData','$mdMedia','$mdDialog','$document','Mensajero',
    function($rootScope, $scope, SalidasDataApi,$mdSidenav,$location,$http,URLS,$timeout,$mdBottomSheet,Auth, Menu, UsuarioData,$mdMedia,$mdDialog,$document,Mensajero){
        $scope.menuSelected = $location.path();
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();

        $scope.filtro = {aplicado:false};
        $scope.menuFiltro = {estatus:'todos'};
        $scope.textoBuscado = '';
        $scope.salidaNueva = undefined;

        $scope.permisoAgregar = '648229AF845F8';
        $scope.permisoEliminar = '648229AF845F8';
        $scope.permisoExportar = '648229AF845F8';

        $scope.datosDelUsuario = {};
        $scope.cargasIniciales = {catalogos:false, listaSalidas:false};
        $scope.parametros = {};
        $scope.cargando = true;
        $scope.cargandoLista = false;
        $scope.smallScreen = !$mdMedia('gt-sm');

        //$scope.cargasIniciales.catalogos = true;

        if($scope.cargasIniciales.listaSalidas){
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

        $scope.crearSalida = function(){
            if(!$scope.salidaNueva){
                $scope.ir('salidas/nuevo');
            }else{
                $scope.ir('salidas/'+$scope.salidaNueva+'/editar');
            }
        }

        $scope.salidasInfinitas = {
          numLoaded_: 0,
          toLoad_: 0,
          salidas: [],
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
            return this.salidas[index];
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
                parametros.pagina = ((this.salidas.length)/50) + 1;
                if($scope.textoBuscado){
                    parametros.query = $scope.textoBuscado;
                }

                SalidasDataApi.lista(parametros,function (res) {
                    console.log(res);
                    if($scope.salidasInfinitas.maxItems != res.totales){
                        $scope.salidasInfinitas.maxItems = res.totales;
                    }


                    //$scope.cargandoLista = false;
                    $scope.cargando = false;

                    for (var i = 0; i < res.data.length; i++){
                        var obj = {
                            id: res.data[i].id,
                            tipo_salida: res.data[i].tipo_salida.descripcion,
                            tipo_salida_id: res.data[i].tipo_salida_id,
                            insumos: 10,
                            acta: res.data[i].acta.folio,
                            icono: 'file-outline',
                            cantidad: 0,
                            fecha: new Date(res.data[i].created_at)

                        };

                        var total = 0;
                        var surtido = 0;
                        for (var j = 0; j < res.data[i].salida_detalle.length; j++){
                            obj.cantidad = obj.cantidad + res.data[i].salida_detalle[j].cantidad_surtido;
                            surtido = surtido + parseInt(res.data[i].salida_detalle[j].cantidad_surtido);
                            total = total + parseInt(res.data[i].salida_detalle[j].cantidad_surtido) + parseInt(res.data[i].salida_detalle[j].cantidad_no_surtido);
                        }
                        var percent_salida = parseFloat((obj.cantidad / total));
                        if(!parseFloat(percent_salida))
                            percent_salida = 0.00;
                        obj.cantidad = obj.cantidad +"/"+total+" ("+percent_salida.toFixed(2)+"% ) ";

                        if(res.data[i].estatus == 1){
                            $scope.salidaNueva = res.data[i].id;
                        }else if(res.data[i].estatus == 2){
                            obj.icono = 'file-lock';
                        }

                        $scope.salidasInfinitas.salidas.push(obj);
                        $scope.salidasInfinitas.numLoaded_++;
                        $scope.cargandoLista = false;
                    }
                    $scope.cargandoLista = false;
                    $scope.cargasIniciales.listaSalidas = true;
                    if($scope.cargasIniciales.catalogos){
                        $scope.cargando = false;
                    }

                }, function (e, status) {
                    if(status == 403){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para listar estos elementos.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar listar los elementos.'});
                    }
                    $scope.salidasInfinitas.maxItems = 0;
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
            
            $scope.actasInfinitas.numLoaded_ = 0;
            $scope.actasInfinitas.toLoad_ = 0;
            $scope.actasInfinitas.actas = [];
            $scope.actasInfinitas.maxItems = 1;
        };

        $scope.eliminarSalida = function(acta,ev){
            var confirm = $mdDialog.confirm()
                .title('Eliminar acta?')
                .content('¿Esta seguro de eliminar esta salida?')
                .targetEvent(ev)
                .ok('Eliminar')
                .cancel('Cancelar');

            $mdDialog.show(confirm).then(function() {
                /*$scope.cargando = true;
                SalidasDataApi.eliminar(acta.id,function (res){
                    if(acta.estatus == 1){
                        $scope.actaNueva = undefined;
                    }

                    var index = $scope.actasInfinitas.actas.indexOf(acta);
                    $scope.actasInfinitas.actas.splice(index,1);
                    $scope.actasInfinitas.numLoaded_ -= 1;
                    $scope.actasInfinitas.maxItems -= 1;
                    
                    $scope.cargando = false;
                },function (e, status){
                    if(status == 403){
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                    }else{
                        Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar eliminar el empleado.'});
                    }
                    $scope.cargando = false;
                    console.log(e);
                });*/
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
    .controller('FormSalidaCtrl',
    ['$rootScope', '$scope', 'SalidasDataApi', '$mdSidenav','$location','$mdBottomSheet','$routeParams','$filter','$localStorage',
    '$http','$mdToast','Auth','Menu','URLS','UsuarioData','$mdDialog','$mdMedia','Mensajero','$window','ImprimirSolicitud',
    function(
    $rootScope, $scope, SalidasDataApi,$mdSidenav,$location,$mdBottomSheet,$routeParams,$filter,$localStorage,
    $http,$mdToast,Auth,Menu,URLS,UsuarioData,$mdDialog,$mdMedia,Mensajero, $window, ImprimirSolicitud
    ){

        $scope.menuSelected = "/salidas";
        $scope.menu = Menu.getMenu();
        $scope.menuIsOpen = false;
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        $scope.toggleDatosActa = true;
        $scope.filtroTipo = 1;
        $scope.captura_habilitada = 1;
        $scope.salidaactaAutoComplete = {searchText:[], acta:{}};
        $scope.cluesDistribucion = [];
        $scope.elementos      = {"concentador": [], "por_clues":[], "clues":[]};
        $scope.salida = {surtido:"0/0", cantidad_surtida : 0, cantidad_total:0, cantidad_solicitada:0, cantidad_restante:0, selectedTipoSalida:0, acta_id:0, realiza:"", autoriza:"", recibe:"", distribucion:0};
        $scope.buscar_insumo = "";


        $scope.permisoAgregar = '648229AF845F8';
        $scope.permisoEditar = '648229AF845F8';
        $scope.permisoEliminar = '648229AF845F8';
        $scope.permisoExportar = '648229AF845F8';

        $scope.permisoEliminar = 'FF915DEC2F235';

        $scope.cargando = true;

        SalidasDataApi.tiposalida({},function (res) {
            //console.log(res.data);
            var arreglo = Array(res.data[0]);
            $scope.tiposalida = arreglo;

        }, function (e, status) {
            if(status == 403){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para listar estos elementos.'});
            }else{
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar listar los elementos.'});
            }
        });

        $scope.fun_buscar_insumo  = function(obj)
        {
            $scope.buscar_insumo = obj;
        }

        if($routeParams.id){
            $scope.cargando = false;

            SalidasDataApi.ver($routeParams.id,function(res){

                console.log(res.data);
                $scope.salida.selectedTipoSalida = res.data.tipo_salida_id;
                $scope.salidaactaAutoComplete.searchText = res.data.acta.folio;

                $scope.salidaactaAutoComplete.actas = res.data.acta;

                $scope.salidaactaAutoCompleteItemChange(res.data);

                $scope.salida.estatus = res.data.estatus;


            },function(e){
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar obtener los datos.'});
                console.log(e);
            });

        }else{
            //$scope.salida = {estatus:1, iva:0.00,total:0.00,subtotal:0.00,requisiciones:{},insumos:[]};
            $scope.cargando = false;
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

        $scope.querySearchSalidaActa = function(query) {
            return $http.get(URLS.BASE_API + '/salidas-actas',{ params:{ query: query, surtido:1 }})
                .then(function(res){
                    return res.data.data;
                });
        };

        $scope.guardar = function()
        {
            SalidasDataApi.crear($scope.salida,function (res){

                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos guardados con éxito.'});
                //console.log(res);
                $location.path('salidas/'+res.data.id+'/editar');

            },function (e, status){
                if(status == 403){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                }else{
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar eliminar el empleado.'});
                }
                $scope.cargando = false;
                console.log(e);
            });
        };

        $scope.editar = function()
        {
            verifica_error();
            SalidasDataApi.editar($routeParams.id, $scope.salida,function (res){

                console.log(res);
                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos guardados con éxito.'});

            },function (e, status){
                if(status == 403){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                }else{
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje: e.error});

                    if(e.insumo)
                        verifica_error(e.insumo);
                }
                $scope.cargando = false;

            });
        };

        function verifica_error(insumo)
        {
            for(var i in $scope.salida.insumos){
                $scope.salida.insumos[i].error = 0;
                if($scope.salida.insumos[i].id == insumo)
                {
                    $scope.salida.insumos[i].error = 1;
                }
            }
            console.log($scope.salida);
        }


        $scope.salidaactaAutoCompleteItemChange = function(object){

            //if($scope.salidaactaAutoComplete.actas.id)
            if($scope.salidaactaAutoComplete.actas)
            {
                SalidasDataApi.cargaInsumosActa($scope.salidaactaAutoComplete.actas.id,function (res){
                    console.log(res);

                    $scope.salida.acta_id = $scope.salidaactaAutoComplete.actas.id;
                    $scope.salida.insumos = [];
                    $scope.cluesDistribucion = [];
                    $scope.salida.cantidad_surtida          = 0;
                    $scope.salida.cantidad_total            = 0;
                    $scope.salida.cantidad_restante         = 0;
                    $scope.salida.cantidad_restante_total   = 0;
                    $scope.salida.distribucion              = 1;

                    var insumos = [];
                    var insumos_index = [];

                    for (var i = 0; i < res.data.length; i++){
                        var obj =
                            {
                            id:                 res.data[i].id,
                            clave:              res.data[i].clave,
                            descripcion:        res.data[i].descripcion,
                            cantidad_total:     res.data[i].cantidad_validada,
                            surtido_salida:     0,
                            surtido_parcial:    res.data[i].surtido,
                            stock:              res.data[i].stock,
                            cantidad_restante:  (parseInt(res.data[i].cantidad_validada) - parseInt(res.data[i].surtido)),
                            error:              0
                            };
                        if(insumos_index[obj.id])
                        {
                            insumos[insumos_index[obj.id]].cantidad_total      += parseInt(insumos[insumos_index[obj.id]].cantidad);
                            insumos[insumos_index[obj.id]].surtido_parcial     += parseInt(insumos[insumos_index[obj.id]].surtido);
                            insumos[insumos_index[obj.id]].cantidad_restante   += (parseInt(insumos[insumos_index[obj.id]].cantidad) - parseInt(insumos[insumos_index[obj.id]].surtido));
                        }else{
                            insumos_index[obj.id] = insumos.length;
                            insumos[insumos_index[obj.id]] = obj;
                        }

                        insumos[insumos_index[obj.id]].unidades = [];
                        var obj_unidad =
                        {
                            clues_unidad:                   res.data[i].clues,
                            nombre_unidad:                  res.data[i].clues_nombre,
                            cantidad_unidad_total:          parseInt(res.data[i].cantidad_validada),
                            surtido_parcial_unidad:         parseInt(res.data[i].surtido),
                            surtido_salida_unidad:          0,
                            surtido_salida_unidad_save:     0,
                            surtido_validado_unidad:        res.data[i].surtido+" / "+res.data[i].cantidad_validada,
                            cantidad_restante_unidad:       (parseInt(res.data[i].cantidad_validada) - parseInt(res.data[i].surtido)),
                            cantidad_restante_total_unidad: (parseInt(res.data[i].cantidad_validada) - parseInt(res.data[i].surtido))
                        };

                        $scope.salida.cantidad_surtida          += parseInt(res.data[i].surtido);
                        $scope.salida.cantidad_total            += parseInt(res.data[i].cantidad_validada);
                        $scope.salida.cantidad_restante         += insumos[insumos_index[obj.id]].cantidad_restante;
                        $scope.salida.cantidad_restante_total   += insumos[insumos_index[obj.id]].cantidad_restante;


                        insumos[insumos_index[obj.id]].unidades[insumos[insumos_index[obj.id]].unidades.length] = obj_unidad;

                    }

                    $scope.salida.insumos = insumos;

                    if(object)
                    {
                        for(var i in object.salida_detalle){
                            for(var j in $scope.salida.insumos){

                               if(object.salida_detalle[i].insumo_id == $scope.salida.insumos[j].id)  //Aqui el id es del insumo
                                {
                                    for(var k in $scope.salida.insumos[j].unidades){
                                        if(object.salida_detalle[i].clues == $scope.salida.insumos[j].unidades[k].clues_unidad)
                                        {

                                            $scope.salida.insumos[j].surtido_salida += parseInt(object.salida_detalle[i].cantidad_surtido);
                                            $scope.salida.insumos[j].unidades[k].surtido_salida_unidad += parseInt(object.salida_detalle[i].cantidad_surtido);
                                            $scope.salida.insumos[j].unidades[k].surtido_salida_unidad_save += parseInt(object.salida_detalle[i].cantidad_surtido);

                                            $scope.salida.insumos[j].unidades[k].cantidad_restante_unidad -= parseInt(object.salida_detalle[i].cantidad_surtido);
                                            $scope.salida.insumos[j].cantidad_restante -= parseInt(object.salida_detalle[i].cantidad_surtido);

                                            $scope.salida.cantidad_solicitada += parseInt(object.salida_detalle[i].cantidad_surtido);
                                            $scope.salida.cantidad_restante -= parseInt(object.salida_detalle[i].cantidad_surtido);
                                        }
                                    }

                                }
                            }
                        }
                    }

                    for(var j in $scope.salida.insumos){
                        for(var k in $scope.salida.insumos){
                            if($scope.salida.insumos[k].cantidad_restante < $scope.salida.insumos[j].cantidad_restante)
                            {
                                var aux = $scope.salida.insumos[k];
                                $scope.salida.insumos[k] = $scope.salida.insumos[j];
                                $scope.salida.insumos[j] = aux;
                            }
                        }

                    }
                    console.log($scope.salida);

                    return true;

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
                $scope.salida.cantidad_surtida          = 0;
                $scope.salida.cantidad_total            = 0;
                $scope.salida.cantidad_solicitada       = 0;
                $scope.salida.cantidad_restante         = 0;
                $scope.salida.cantidad_restante_total   = 0;
                $scope.salida.insumos                   = [];
                $scope.salida.distribucion              = 0;
            }
        };

        $scope.generarDistribucion = function(ev)
        {
            var stock_total = 0;

            for(var i in $scope.salida.insumos){
                var cantidad_suministrada = 0;
                for(var j in $scope.salida.insumos[i].unidades){

                    $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad = parseInt($scope.salida.insumos[i].unidades[j].cantidad_restante_unidad) + parseInt($scope.salida.insumos[i].unidades[j].surtido_salida_unidad);
                    $scope.salida.insumos[i].unidades[j].surtido_salida_unidad      = 0;
                    $scope.salida.insumos[i].unidades[j].surtido_salida_unidad_save = 0;
                    cantidad_suministrada = cantidad_suministrada + $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad;
                }
                $scope.salida.insumos[i].surtido_salida     = 0;
                $scope.salida.insumos[i].cantidad_restante  = cantidad_suministrada;
            }

            var salida_total = 0;
            for(var i in $scope.salida.insumos){
                var stock = parseInt($scope.salida.insumos[i].stock);
                stock_total += stock;
                var salida_parcial = 0;
                if(stock >= $scope.salida.insumos[i].cantidad_restante)
                {
                    for(var j in $scope.salida.insumos[i].unidades){
                        $scope.salida.insumos[i].unidades[j].surtido_salida_unidad      = $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad;
                        $scope.salida.insumos[i].unidades[j].surtido_salida_unidad_save = $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad;
                        $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad   = 0;
                    }
                    $scope.salida.insumos[i].surtido_salida     = $scope.salida.insumos[i].cantidad_restante;
                    salida_total = salida_total + parseInt($scope.salida.insumos[i].surtido_salida);
                    salida_parcial = salida_parcial + parseInt($scope.salida.insumos[i].surtido_salida);
                    $scope.salida.insumos[i].cantidad_restante  = 0;
                }else{
                    var porcentaje_general = Math.floor(((stock / $scope.salida.insumos[i].cantidad_restante) * 100));
                    porcentaje_general = (porcentaje_general/100);

                    for(var j in $scope.salida.insumos[i].unidades){
                        if(stock > 0)
                        {
                            var cantidad_resta = Math.floor(($scope.salida.insumos[i].unidades[j].cantidad_restante_total_unidad * porcentaje_general));
                            $scope.salida.insumos[i].unidades[j].surtido_salida_unidad      = cantidad_resta;
                            $scope.salida.insumos[i].unidades[j].surtido_salida_unidad_save = cantidad_resta;
                            $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad   = parseInt(($scope.salida.insumos[i].unidades[j].cantidad_restante_unidad - cantidad_resta));
                            salida_total = salida_total + parseInt(cantidad_resta);
                            salida_parcial = salida_parcial + parseInt(cantidad_resta);
                            stock = stock - cantidad_resta;
                        }else
                        {
                            break;
                        }
                    }
                    if(stock > 0)
                    {
                        for(var j in $scope.salida.insumos[i].unidades){
                            if(stock > 0)
                            {
                                if($scope.salida.insumos[i].unidades[j].cantidad_restante_unidad >= stock)
                                {
                                    $scope.salida.insumos[i].unidades[j].surtido_salida_unidad      = ($scope.salida.insumos[i].unidades[j].surtido_salida_unidad + stock);
                                    $scope.salida.insumos[i].unidades[j].surtido_salida_unidad_save = ($scope.salida.insumos[i].unidades[j].surtido_salida_unidad + stock);
                                    $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad   = ($scope.salida.insumos[i].unidades[j].cantidad_restante_unidad - stock);
                                    salida_total = salida_total + parseInt(stock);
                                    salida_parcial = salida_parcial + parseInt(stock);
                                    stock = 0;
                                }else{
                                    $scope.salida.insumos[i].unidades[j].surtido_salida_unidad      = ($scope.salida.insumos[i].unidades[j].surtido_salida_unidad + $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad);
                                    $scope.salida.insumos[i].unidades[j].surtido_salida_unidad_save = ($scope.salida.insumos[i].unidades[j].surtido_salida_unidad + $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad);
                                    $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad   = 0;
                                    salida_total = salida_total + parseInt($scope.salida.insumos[i].unidades[j].cantidad_restante_unidad);
                                    salida_parcial = salida_parcial + parseInt($scope.salida.insumos[i].unidades[j].cantidad_restante_unidad);
                                    stock = stock - $scope.salida.insumos[i].unidades[j].cantidad_restante_unidad;
                                }

                            }else
                            {
                                break;
                            }
                        }
                    }

                    //$scope.salida.insumos[i].surtido_salida     = parseInt($scope.salida.insumos[i].stock);
                    $scope.salida.insumos[i].surtido_salida     = parseInt(salida_parcial);
                    //$scope.salida.insumos[i].cantidad_restante  = ($scope.salida.insumos[i].cantidad_restante - parseInt($scope.salida.insumos[i].stock));
                    $scope.salida.insumos[i].cantidad_restante  = parseInt(($scope.salida.insumos[i].cantidad_restante - salida_parcial));
                }
            }

            $scope.salida.cantidad_solicitada = salida_total;
            $scope.salida.cantidad_restante = parseInt(($scope.salida.cantidad_restante - salida_total));

        }

        $scope.finalizarSalida = function(ev)
        {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;


            var locals = {
                salida: $scope.salida
            };

            $mdDialog.show({
                controller: function($scope, $mdDialog, salida) {
                    $scope.nombres = {"realiza":"", "autoriza":"", "recibe":""};
                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };

                    $scope.answer = function(cerrar) {
                        var errores = false;
                        var finalizacion = $scope.nombres;
                        $scope.validacion = {};

                        if(!$scope.nombres.realiza)
                        {
                            $scope.validacion.realiza = {'required':true};
                            errores = true;
                        }

                        if(!$scope.nombres.autoriza)
                        {
                            $scope.validacion.autoriza = {'required':true};
                            errores = true;
                        }

                        if(!$scope.nombres.recibe)
                        {
                            $scope.validacion.recibe = {'required':true};
                            errores = true;
                        }


                        if(!errores)
                        {
                            salida.realiza  = $scope.nombres.realiza;
                            salida.autoriza = $scope.nombres.autoriza;
                            salida.recibe   = $scope.nombres.recibe;

                            salida.estatus = 2;

                            verifica_error();
                            SalidasDataApi.editar($routeParams.id, salida,function (res){
                                $mdDialog.cancel();
                                Mensajero.mostrarToast({contenedor:'#modulo-contenedor',mensaje:'Datos guardados con éxito.'});
                                $location.path('salidas/');
                            },function (e, status){
                                if(status == 403){
                                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                                }else{
                                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje: e.error});

                                    if(e.insumo)
                                        verifica_error(e.insumo);
                                }
                                $scope.cargando = false;

                            });
                        }else{
                            return false;
                        }
                    }

                },
                templateUrl: 'src/salidas/views/form-finalizar.html',
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

        $scope.editarInsumoSalida = function(ev,insumo){


            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            var inventario = 0;
            SalidasDataApi.cargaInventario(insumo.id,function (res){
                if(res.data)
                    insumo.stock = res.data.inventario;
                else
                    insumo.stock = 0;
            },function (e, status){
                if(status == 403){
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Acceso Denegado:',mensaje:'No tiene permiso para eliminar este elemento.'});
                }else{
                    Mensajero.mostrarToast({contenedor:'#modulo-contenedor',titulo:'Error:',mensaje:'Ocurrió un error al intentar eliminar el empleado.'});
                }
                $scope.cargando = false;
                console.log(e);
            });

            var locals = {
                insumo: insumo,
                totales: $scope.salida
            };

            $mdDialog.show({
                controller: function($scope, $mdDialog, insumo, totales) {
                    $scope.insumo_editado = [];
                    $scope.totales = totales;
                    $scope.insumo_editado = insumo;


                    $scope.cancel = function() {
                        reset_insumo();

                        $mdDialog.cancel();
                    };
                    $scope.answer = function(cerrar) {

                        if(!calcular_total_salida())
                            $mdDialog.cancel();
                        recalcula_totales_generales();
                    }

                    $scope.recalculaCantidades = function(indice)
                    {
                        if(parseInt(insumo.unidades[indice].surtido_salida_unidad) >=0)
                            insumo.unidades[indice].cantidad_restante_unidad = parseInt(insumo.unidades[indice].cantidad_restante_total_unidad) - parseInt(insumo.unidades[indice].surtido_salida_unidad);
                    }

                    function reset_insumo()
                    {
                        for(var i in $scope.insumo_editado.unidades){
                            $scope.insumo_editado.unidades[i].cantidad_restante_unidad += parseInt($scope.insumo_editado.unidades[i].surtido_salida_unidad);
                            $scope.insumo_editado.unidades[i].surtido_salida_unidad = $scope.insumo_editado.unidades[i].surtido_salida_unidad_save;
                        }
                    }

                    function calcular_total_salida()
                    {
                        var total_salida = 0;
                        var errores = false;
                        for(var i in $scope.insumo_editado.unidades){
                            var insumo_capturado = $scope.insumo_editado.unidades[i];

                            insumo_capturado.validacion = {};

                            if(insumo_capturado.surtido_salida_unidad){
                                if(insumo_capturado.surtido_salida_unidad < 0){
                                    insumo_capturado.validacion.cantidad = {min:true};
                                    errores = true;
                                }

                                if(insumo_capturado.cantidad_restante_total_unidad <  (parseInt(insumo_capturado.surtido_salida_unidad) + parseInt(insumo_capturado.surtido_parcial_unidad))){
                                    insumo_capturado.validacion.cantidad = {max:true};
                                    errores = true;
                                }
                            }
                            total_salida += parseInt($scope.insumo_editado.unidades[i].surtido_salida_unidad);
                        }

                        $scope.insumo_editado.surtido_salida = total_salida;
                        $scope.insumo_editado.cantidad_restante = (parseInt($scope.insumo_editado.cantidad_total) - parseInt($scope.insumo_editado.surtido_salida) - parseInt($scope.insumo_editado.surtido_parcial));4

                        return errores;

                    }

                    function recalcula_totales_generales()
                    {

                        var total_solicitada = 0;
                        var total_restante = 0;
                        for(var i in $scope.totales.insumos){
                            console.log($scope.totales.insumos[i]);
                            total_solicitada    += parseInt($scope.totales.insumos[i].surtido_salida);
                            total_restante      += parseInt($scope.totales.insumos[i].cantidad_restante);

                        }

                        $scope.totales.cantidad_restante = total_restante;
                        $scope.totales.cantidad_solicitada = total_solicitada;
                        //console.log(totales);
                    }

                },
                templateUrl: 'src/salidas/views/salida-insumo.html',
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