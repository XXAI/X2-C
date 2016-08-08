(function(){
	'use strict';
    angular.module('DashboardModule')
    .controller('DashboardCtrl',
    ['$rootScope', '$scope', 'DashboardDataApi', '$mdSidenav','$location','$mdBottomSheet','$timeout','Auth','Menu','UsuarioData',
    function($rootScope, $scope, DashboardDataApi,$mdSidenav,$location,$mdBottomSheet,$timeout,Auth, Menu, UsuarioData){
        $scope.menuSelected = $location.path();
        $scope.menuIsOpen = false;
        $scope.menu = Menu.getMenu();
        $scope.loggedUser = UsuarioData.getDatosUsuario();
        
        $scope.userInfo = {
          totalActasFin: 0,
          totalActasCap: 0,
          totalRequisiciones: 0
        };

        DashboardDataApi.cargarDatos(function(res){
          $scope.userInfo.totalActasFin       = res.data.total_actas_finalizadas;
          $scope.userInfo.totalActasCap       = res.data.total_actas_capturadas;
          $scope.userInfo.totalRequisiciones  = res.data.total_requisiciones;
          $scope.appInfo = res.data.configuracion;
        },function(e) {
          // body...
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
    }]);
})();