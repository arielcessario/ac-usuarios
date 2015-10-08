(function () {
    'use strict';

    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;

    angular.module('acUsuarios', ['ngCookies'])
        .config(['$routeProvider', 'jwtInterceptorProvider', '$httpProvider',
            function ($routeProvider, jwtInterceptorProvider, $httpProvider) {
                jwtInterceptorProvider.tokenGetter = function (store) {
                    return store.get('jwt');
                };
                $httpProvider.interceptors.push('jwtInterceptor');
            }])
        .run(function ($rootScope, store, jwtHelper, $location, UserVars) {
            // Para activar la seguridad en una vista, agregar data:{requiresLogin:false} dentro de $routeProvider.when

            $rootScope.$on('$routeChangeStart', function (e, to) {
                if (to && to.data && to.data.requiresLogin) {
                    if (!store.get('jwt')) {
                        e.preventDefault();
                        $location.path(UserVars.loginPath);
                    }
                }
            });
        })
        .factory('UserService', UserService)
        .service('UserVars', UserVars)
    ;


    UserService.$inject = ['$http', '$cookieStore', 'store', 'UserVars', '$cacheFactory'];
    function UserService($http, $cookieStore, store, UserVars, $cacheFactory) {
        //Variables
        var service = {};

        var url = currentScriptPath.replace('ac-usuarios.js', '/includes/ac-usuarios.php');

        //Function declarations
        service.getLogged = getLogged;
        service.setLogged = setLogged;
        service.checkLastLogin = checkLastLogin;

        service.create = create;
        service.remove = remove;
        service.update = update;

        service.get = get;
        service.getById = getById;
        service.getByParams = getByParams;

        service.login = login;
        service.logout = logout;

        service.userExist = userExist;
        service.forgotPassword = forgotPassword;

        service.goToPagina = goToPagina;
        service.next = next;
        service.prev = prev;

        return service;

        //Functions

        /**
         *
         * @description Retorna la lista filtrada de productos
         * @param param -> String, separado por comas (,) que contiene la lista de parámetros de búsqueda, por ej: nombre, sku, tienen que ser el mismo nombre que en la base
         * @param value -> termino a buscar
         * @param exact_match -> true, busca la palabra exacta, false, busca si el termino aparece
         * @param callback
         */
        function getByParams(param, value, exact_match, callback) {
            get(function (data) {
                var parametros = param.split(',');


                var respuesta = [];
                for (var y = 0; y < data.length; y++) {
                    var columns = Object.keys(data[y]);

                    for (var i = 0; i < columns.length; i++) {
                        for (var x = 0; x < parametros.length; x++) {
                            if (columns[i] == parametros[x]) {

                                var base = '' + data[y][Object.keys(data[y])[i]];
                                var valor = '' + value;
                                if (
                                    ( exact_match && base.toUpperCase() == valor.toUpperCase()) ||
                                    (!exact_match && base.indexOf(valor) > -1)
                                ) {
                                    respuesta.push(data[y]);
                                    x = parametros.length;
                                    i = columns.length;
                                }
                            }
                        }
                    }
                }
                callback(respuesta);
            })
        }


        /** @name: remove
         * @param usuario_id, callback
         * @description: Elimina el usuario seleccionado.
         */
        function remove(usuario_id, callback) {
            return $http.post(url,
                {function: 'remove', 'usuario_id': usuario_id})
                .success(function (data) {
                    //console.log(data);
                    if (data !== 'false') {

                        callback(data);
                    }
                })
                .error(function (data) {
                    callback(data);
                })
        }

        /** @name: get
         * @param callback
         * @description: Retorna todos los usuario de la base.
         */
        function get(callback) {
            var urlGet = url + '?function=get';
            var $httpDefaultCache = $cacheFactory.get('$http');
            var cachedData = [];


            // Verifica si existe el cache de usuarios
            if ($httpDefaultCache.get(urlGet) != undefined) {
                if (UserVars.clearCache) {
                    $httpDefaultCache.remove(urlGet);
                }
                else {
                    //console.log('lo');
                    cachedData = $httpDefaultCache.get(urlGet);
                    callback(cachedData);
                    return;
                }
            }


            return $http.get(urlGet, {cache: true})
                .success(function (data) {
                    $httpDefaultCache.put(urlGet, data);
                    UserVars.clearCache = false;
                    UserVars.paginas = (data.length % UserVars.paginacion == 0) ? parseInt(data.length / UserVars.paginacion) : parseInt(data.length / UserVars.paginacion) + 1;
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                    UserVars.clearCache = false;
                })
        }

        /** @name: getById
         * @param usuario_id, callback
         * @description: Retorna el usuario que tenga el id enviado.
         */
        function getById(id, callback) {
            get(function (data) {
                var response = data.filter(function (elem, index, array) {
                    return elem.usuario_id == id;
                })[0];
                callback(response);
            });
        }

        /**
         * todo: Hay que definir si vale la pena
         */
        function checkLastLogin() {

        }


        /** @name: userExist
         * @param mail
         * @description: Verifica que el mail no exista en la base.
         */
        function userExist(mail, callback) {
            return $http.post(url,
                {'function': 'existeUsuario', 'mail': mail})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                })
        }

        /**@name: logout
         @description: Logout
         */
        function logout() {
            store.remove('jwt');
            $cookieStore.remove('user');
            UserVars.clearCache = true;
        }


        /**
         *
         * @description: realiza login
         * @param mail
         * @param password
         * @param sucursal_id
         * @param callback
         * @returns {*}
         */
        function login(mail, password, sucursal_id, callback) {
            return $http.post(url,
                {'function': 'login', 'mail': mail, 'password': password, 'sucursal_id': sucursal_id})
                .success(function (data) {
                    if (data != -1) {
                        $cookieStore.put('user', data.user);
                        store.set('jwt', data.token);
                    }
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                })
        }

        /**
         * @description: Crea un usuario.
         * @param usuario
         * @param callback
         * @returns {*}
         */
        function create(usuario, callback) {

            return $http.post(url,
                {
                    'function': 'create',
                    'user': JSON.stringify(usuario)
                })
                .success(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                });
        }

        /** @name: getLogged
         * @description: Retorna si existe una cookie de usuario.
         */
        function getLogged() {
            var globals = $cookieStore.get('user');

            if (globals !== undefined && globals.user !== undefined) {
                return globals;
            } else {
                return false;
            }
        }

        /** @name: setLogged
         * @param user
         * @description: Setea al usuario en una cookie. No está agregado al login ya que no en todos los casos se necesita cookie.
         */
        function setLogged(user) {
            $cookieStore.set('user', user);
        }

        function changePassword(usuario_id, pass_old, pass_new, callback) {

            return $http.post(url,
                {
                    function: 'changePassword',
                    usuario_id: usuario_id,
                    pass_old: pass_old,
                    pass_new: pass_new
                })
                .success(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                })
        }


        /** @name: update
         * @param usuario
         * @param callback
         * @description: Realiza update al usuario.
         */
        function update(usuario, callback) {
            return $http.post(url,
                {
                    'function': 'update',
                    'user': JSON.stringify(usuario)
                })
                .success(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });
        }


        /** @name: forgotPassword
         * @param email
         * @description: Genera y reenvia el pass al usuario.
         */
        function forgotPassword(email, callback) {

            return $http.post(url,
                {
                    'function': 'forgotPassword',
                    'email': email
                })
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });
        }

        /**
         * Para el uso de la páginación, definir en el controlador las siguientes variables:
         *
         vm.start = 0;
         vm.pagina = UserVars.pagina;
         UserVars.paginacion = 5; Cantidad de registros por página
         vm.end = UserVars.paginacion;


         En el HTML, en el ng-repeat agregar el siguiente filtro: limitTo:appCtrl.end:appCtrl.start;

         Agregar un botón de next:
         <button ng-click="appCtrl.next()">next</button>

         Agregar un botón de prev:
         <button ng-click="appCtrl.prev()">prev</button>

         Agregar un input para la página:
         <input type="text" ng-keyup="appCtrl.goToPagina()" ng-model="appCtrl.pagina">

         */


        /**
         * @description: Ir a página
         * @param pagina
         * @returns {*}
         * uso: agregar un método
         vm.goToPagina = function () {
                vm.start= UserService.goToPagina(vm.pagina).start;
            };
         */
        function goToPagina(pagina) {

            if (isNaN(pagina) || pagina < 1) {
                UserVars.pagina = 1;
                return UserVars;
            }

            if (pagina > UserVars.paginas) {
                UserVars.pagina = UserVars.paginas;
                return UserVars;
            }

            UserVars.pagina = pagina - 1;
            UserVars.start = UserVars.pagina * UserVars.paginacion;
            return UserVars;

        }

        /**
         * @name next
         * @description Ir a próxima página
         * @returns {*}
         * uso agregar un metodo
         vm.next = function () {
                vm.start = UserService.next().start;
                vm.pagina = UserVars.pagina;
            };
         */
        function next() {

            if (UserVars.pagina + 1 > UserVars.paginas) {
                return UserVars;
            }
            UserVars.start = (UserVars.pagina * UserVars.paginacion);
            UserVars.pagina = UserVars.pagina + 1;
            //UserVars.end = UserVars.start + UserVars.paginacion;
            return UserVars;
        }

        /**
         * @name previous
         * @description Ir a página anterior
         * @returns {*}
         * uso, agregar un método
         vm.prev = function () {
                vm.start= UserService.prev().start;
                vm.pagina = UserVars.pagina;
            };
         */
        function prev() {


            if (UserVars.pagina - 2 < 0) {
                return UserVars;
            }

            //UserVars.end = UserVars.start;
            UserVars.start = (UserVars.pagina - 2 ) * UserVars.paginacion;
            UserVars.pagina = UserVars.pagina - 1;
            return UserVars;
        }


    }


    UserVars.$inject = [];
    /**
     *
     * @constructor
     */
    function UserVars() {
        // Cantidad de páginas total del recordset
        this.paginas = 1;
        // Página seleccionada
        this.pagina = 1;
        // Cantidad de registros por página
        this.paginacion = 10;
        // Registro inicial, no es página, es el registro
        this.start = 0;


        // Indica si se debe limpiar el caché la próxima vez que se solicite un get
        this.clearCache = true;

        // Path al login
        this.loginPath = '/login';
    }

})();