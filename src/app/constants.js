(function(){
	'use strict';
    
	angular.module('App').constant('MENU',[
                        { 
                            grupo: false,
                            lista: [
                                { titulo: 'Tablero', key: 'DASHBOARD', path: '/dashboard', icono: 'view-dashboard' }
                            ]
                         },
                         { 
                            grupo:false ,
                            lista: [
                                { titulo: 'Actas', key: 'LISTAR_ACTAS', path: '/actas', icono: 'file-document-box' }
                            ]
                         },
                         { 
                            grupo:'Administrador' ,
                            lista: [
                                { titulo: 'Usuarios', key: 'gvk27TgNQ76RbOsG5tB83bpNO3zCRhdd', path: '/usuarios', icono: 'account' }
                            ]
                         },
						 {
                            grupo:'otro grupo',
                            lista: [
                                { titulo: 'Acerca de', key: 'ACERCADE', path: '/acerca-de', icono: 'info' }
                            ]
                         },
					]);
	angular.module('App').constant('MENU_PUBLICO',[
                        { icono:'exit-to-app' , titulo:'INICIAR_SESION', path:'signin' },
               			{ icono:'information' , titulo:'QUE_ES_APP', path:'que-es' }  
						 
	]);
})();