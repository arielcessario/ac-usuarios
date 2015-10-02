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
        service.getByEmail = getByEmail;

        service.login = login;
        service.logout = logout;

        service.userExist = userExist;
        service.forgotPassword = forgotPassword;

        service.goToAPagina = goToPagina;
        service.nextPagina = nextPagina;
        service.previousPagina = previousPagina;

        return service;

        //Functions
        /** @name: remove
         * @params: usuario_id, callback
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
         * @params: callback
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
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                    UserVars.clearCache = false;
                })
        }

        /** @name: getById
         * @params: usuario_id, callback
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
         * @params: mail
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


        /**@name: login
         @params: mail, password, callback
         @description: realiza login
         */
        function login(mail, password, callback) {
            return $http.post(url,
                {'function': 'login', 'mail': mail, 'password': password})
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

        /** @name: create
         * @params: usuario, callback
         * @description: Crea un usuario.
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
         * @params:
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
         * @params:
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

        /** @name: getByEmail
         * @params: mail, callback
         * @description: Obtiene al usuario filtrado por mail del cache completo.
         */
        function getByEmail(mail, callback) {
            get(function (data) {
                var response = data.filter(function (elem, index, array) {
                    return elem.mail == mail;
                })[0];
                callback(response);
            });
        }

        /** @name: update
         * @params: usuario, callback
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
         * @params: email
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
         * @description: Ir a página
         * @param pagina
         * @returns {*}
         */
        function goToPagina(pagina) {

            if (UserVars.pagina < 1) {
                UserVars.pagina = 1;
                return;
            }

            if (UserVars.pagina > UserVars.paginas) {
                UserVars.pagina = UserVars.paginas;
                return;
            }


            UserVars.pagina = pagina;
            UserVars.start = UserVars.pagina * UserVars.paginacion;
            UserVars.end = UserVars.start + UserVars.paginacion;
            return UserVars;

        }

        /**
         * @name nextPagina
         * @description Ir a próxima página
         * @returns {*}
         */
        function nextPagina() {

            if (UserVars.pagina + 1 > UserVars.paginas) {
                return;
            }

            UserVars.start = (UserVars.pagina) * UserVars.paginacion;
            UserVars.pagina = UserVars.pagina + 1;
            //UserVars.end = UserVars.start + UserVars.paginacion;
            return UserVars;
        }

        /**
         * @name previousPagina
         * @description Ir a página anterior
         * @returns {*}
         */
        function previousPagina() {
            if (UserVars.pagina - 2 <= 0) {
                return;
            }

            //UserVars.end = UserVars.start;
            UserVars.start = (UserVars.pagina - 2 ) * UserVars.paginacion;
            UserVars.pagina = UserVars.pagina - 1;
            return UserVars;
        }

        /**
         * @description remueve los valores undefined
         * @param usuario
         * @returns {*}
         */


    }


    UserVars.$inject = [];
    /**
     *
     * @constructor
     */
    function UserVars() {
        // Cantidad de páginas total del recordset
        this.paginas = 0;
        // Página seleccionada
        this.pagina = 0;
        // Cantidad de registros por página
        this.paginacion = 10;
        // Registro inicial
        this.start = 0;
        // Registro Final
        this.end = function(){
            return this.start + this.paginacion;
        };


        // Indica si se debe limpiar el caché la próxima vez que se solicite un get
        this.clearCache = true;
    }

})();