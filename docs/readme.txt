TODO:


Dependencies:
ng-cookies
angular-storage (a0-angular-storage)
angular-jwt

Notas:
En el raíz del sitio se debe crear una carpeta llamada includes y dentro de la misma crear un archivo llamado config.php

Dentro del mismo incluir las siguientes lineas

// JWT Secret Key
$secret = 'uiglp';
// JWT AUD
$serverName = 'serverName';
// false local / true production
$jwt_enabled = false;