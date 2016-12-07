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
                                { titulo: 'Actas',                  key: 'AFE7E7583A18C', path: '/actas',                       icono: 'file-document-box'  },
                                { titulo: 'Requisición unidades',   key: '8164C929918CE', path: '/requisicionesunidades',       icono: 'file-document-box'  },
                                { titulo: 'Solicitudes',            key: '6F5427E97863A', path: '/solicitudes',                 icono: 'file-document'      },
                                { titulo: 'Requisiciones',          key: '4E4D8E11F6E4A', path: '/requisiciones',               icono: 'file'               },
                                { titulo: 'Recepcion',              key: '97728B3AD53DB', path: '/recepcion',                   icono: 'truck'              },
                                { titulo: 'Salidas',                key: '97728B3AD53DB', path: '/salidas',                     icono: 'pill'               }
                            ]//97728B3AD53DB
                         },
                         { 
                            grupo:'Administrador' ,
                            lista: [
                                { titulo: 'Configuración', key: '71A3786CCEBD4', path: '/configuracion', icono: 'settings'}
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