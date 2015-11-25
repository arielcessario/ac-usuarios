TODO:


Dependencies:
ng-cookies
angular-storage (a0-angular-storage)
angular-jwt
ac-angular-utils
//cdn.auth0.com/js/lock-7.9.js
//cdn.auth0.com/w2/auth0-angular-4.js (auth0)

Notas:
En el ra�z del sitio se debe crear una carpeta llamada includes y dentro de la misma crear un archivo llamado config.php

Dentro del mismo incluir las siguientes lineas

// JWT Secret Key
$secret = 'uiglp';
// JWT Secret Key Social
$secret_social = 'LUc_cGQHgmKZyFd5ozKJHnujpam1JKb06FWnjjtnWH9htNKDEQFGNMHYUvX_6PgR';
// JWT AUD
$serverName = 'serverName';
// false local / true production
$jwt_enabled = false;