<?php
/* TODO: Toda la parte de seguridad tiene que estar en todos los php que hagamos
 * */


session_start();

require 'PHPMailerAutoload.php';


// false local / true production
$jwt_enabled = true;
// Token
$decoded_token = null;
// JWT Secret Key
$secret = 'uiglp';
// JWT AUD
$serverName = 'serverName';

require_once '/config.php';

if (file_exists('../../../MyDBi.php')) {
    require_once '../../../MyDBi.php';
} else {
    require_once 'MyDBi.php';
}

$data = file_get_contents("php://input");

// Decode data from js
$decoded = json_decode($data);


// Si la seguridad está activa
if ($jwt_enabled) {

    // Carga el jwt_helper
    if (file_exists('../../../jwt_helper.php')) {
        require_once '../../../jwt_helper.php';
    } else {
        require_once 'jwt_helper.php';
    }


    // Las funciones en el if no necesitan usuario logged
    if ($decoded != null &&
        ($decoded->function == 'login' ||
            $decoded->function == 'create' ||
            $decoded->function == 'clientExist' ||
            $decoded->function == 'forgotPassword')
    ) {
        $token = '';
    } else {
        checkSecurity();
    }

}


if ($decoded != null) {
    if ($decoded->function == 'login') {
        login($decoded->mail, $decoded->password);
    } else if ($decoded->function == 'checkLastLogin') {
        checkLastLogin($decoded->userid);
    } else if ($decoded->function == 'create') {
        create($decoded->user);
    } else if ($decoded->function == 'userExist') {
        userExist($decoded->mail);
    } else if ($decoded->function == 'changePassword') {
        changePassword($decoded->usuario_id, $decoded->pass_old, $decoded->pass_new);
    } else if ($decoded->function == 'update') {
        update($decoded->user);
    } else if ($decoded->function == 'remove') {
        remove($decoded->usuario_id);
    } else if ($decoded->function == 'forgotPassword') {
        forgotPassword($decoded->email);
    }
} else {
    $function = $_GET["function"];
    if ($function == 'get') {
        get();
    }
}

/* @name: checkSecurity
 * @params:
 * @description: Verifica las credenciales enviadas. En caso de no ser correctas, retorna el error correspondiente.
 */
function checkSecurity()
{
    $requestHeaders = apache_request_headers();
    $authorizationHeader = $requestHeaders['Authorization'];
//    echo print_r(apache_request_headers());


    if ($authorizationHeader == null) {
        header('HTTP/1.0 401 Unauthorized');
        echo "No authorization header sent";
        exit();
    }

    // // validate the token
    $pre_token = str_replace('Bearer ', '', $authorizationHeader);
    $token = str_replace('"', '', $pre_token);
    global $secret;
    global $decoded_token;
    try {
        $decoded_token = JWT::decode($token, base64_decode(strtr($secret, '-_', '+/')), false);
    } catch (UnexpectedValueException $ex) {
        header('HTTP/1.0 401 Unauthorized');
        echo "Invalid token";
        exit();
    }


    global $serverName;

    // // validate that this token was made for us
    if ($decoded_token->aud != $serverName) {
        header('HTTP/1.0 401 Unauthorized');
        echo "Invalid token";
        exit();
    }

}

/* @name: forgotPassword
 * @params: $email = email del usuario
 * @description: Envia al usuario que lo solicita, un password aleatorio. El password se envía desde acá porque no debe
 * pasar por js, el js está en el cliente, lo cual podría dar un punto para conseguir un pass temporal.
 * todo: Agregar tiempo límite para el cambio. Agregar template de mail dinámico.
 */
function forgotPassword($email)
{

    $db = new MysqliDb();
    $options = ['cost' => 12];
    $new_password = randomPassword();

    $password = password_hash($new_password, PASSWORD_BCRYPT, $options);

    $data = array('password' => $password);

    $db->where('mail', $email);

    if ($db->update('usuarios', $data)) {
        $mail = new PHPMailer;
        $mail->isSMTP();                                      // Set mailer to use SMTP
        $mail->Host = 'gator4184.hostgator.com';  // Specify main and backup SMTP servers
        $mail->SMTPAuth = true;                               // Enable SMTP authentication
        $mail->Username = 'ventas@ac-desarrollos.com';                 // SMTP username
        $mail->Password = 'ventas';                           // SMTP password
        $mail->SMTPSecure = 'ssl';                            // Enable TLS encryption, `ssl` also accepted
        $mail->Port = 465;

        $mail->From = 'ventas@ac-desarrollos.com';
        $mail->FromName = 'UIGLP';
        $mail->addAddress($email);     // Add a recipient
        $mail->addAddress('arielcessario@gmail.com');     // Add a recipient
        $mail->addAddress('juan.dilello@gmail.com');               // Name is optional
        $mail->addAddress('diegoyankelevich@gmail.com');
        $mail->isHTML(true);    // Name is optional

        $mail->Subject = 'Recuperar Contraseña UGLP';
        $mail->Body = "
            <table>
                <tr>
                    <td>Te enviamos a continuación la siguiente contraseña.</td>
                </tr>
                <tr>
                    <td>Nueva Contraseña:</td>
                </tr>
                <tr>
                    <td>" . $new_password . "</td>
                </tr>
                <tr>
                    <td>UIGLP</td>
                </tr>
                <tr>
                    <td></td>
                </tr>
                <tr>
                    <td></td>
                </tr>
            </table>";
        $mail->AltBody = "Nuevo Mail:" . $new_password;

        if (!$mail->send()) {
            echo 'Message could not be sent.';
            echo 'Mailer Error: ' . $mail->ErrorInfo;
        } else {
            echo 'Message has been sent';
        }
    }
}


/* @name: randomPassword
 * @description: Genera password aleatorio.
 * @return: array(string) crea un array de 8 letra
 */
function randomPassword()
{
    $alphabet = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    $pass = array(); //remember to declare $pass as an array
    $alphaLength = strlen($alphabet) - 1; //put the length -1 in cache
    for ($i = 0; $i < 8; $i++) {
        $n = rand(0, $alphaLength);
        $pass[] = $alphabet[$n];
    }
    return implode($pass); //turn the array into a string
}


/* @name: createToken
 * @params:
 * @description: Envia al usuario que lo solicita, un password aleatorio.
 * @return: JWT:string de token
 * todo: Agregar tiempos de expiración. Evaluar si hay que devolver algún dato dentro de data.
 */
function createToken()
{

    $tokenId = base64_encode(mcrypt_create_iv(32));
    $issuedAt = time();
    $notBefore = $issuedAt + 10;             //Adding 10 seconds
    $expire = $notBefore + 60;            // Adding 60 seconds
    global $serverName; // Retrieve the server name from config file
    $aud = '';
//        $serverName = $config->get('serverName'); // Retrieve the server name from config file

    /*
     * Create the token as an array
     */
    $data = [
        'iat' => $issuedAt,         // Issued at: time when the token was generated
        'jti' => $tokenId,          // Json Token Id: an unique identifier for the token
        'iss' => $serverName,       // Issuer
        'nbf' => $notBefore,        // Not before
        'exp' => $expire,           // Expire
        'aud' => $aud,           // Expire
        'data' => [                  // Data related to the signer user
//            'id' => $id, // userid from the users table
//            'nombre' => $nombre, // User name
//            'apellido' => $apellido, // User name
//            'mail' => $mail, // User name
//            'rol' => $rol // Rol
        ]
    ];

    global $secret;
    return JWT::encode($data, $secret);
    /*
     * More code here...
     */
}

/* @name: remove
 * @params: $usuario_id = id de usuario
 * @description: Borra un usuario y su dirección.
 * todo: Sacar dirección y crear sus propias clases dentro de este mismo módulo.
 */
function remove($usuario_id)
{
    $db = new MysqliDb();

    $db->where("usuario_id", $usuario_id);
    $results = $db->delete('usuarios');

    $db->where("usuario_id", $usuario_id);
    $results = $db->delete('direcciones');

    if ($results) {

        echo json_encode(1);
    } else {
        echo json_encode(-1);

    }
}

/* @name: get
 * @params:
 * @description: Obtiene todos los usuario con sus direcciones.
 * todo: Sacar dirección y crear sus propias clases dentro de este mismo módulo.
 */
function get()
{
    $db = new MysqliDb();
    $results = $db->get('usuarios');

    foreach ($results as $key => $row) {
        $db->where('usuario_id', $row['usuario_id']);
        $direcciones = $db->get('direcciones');

        $results[$key]['direcciones'] = $direcciones;
    }
    echo json_encode($results);
}


/* @name: login
 * @params: $email, $password
 * @description: Valida el ingreso de un usuario.
 * todo: Sacar dirección y crear sus propias clases dentro de este mismo módulo.
 */
function login($mail, $password)
{
    $db = new MysqliDb();
    $db->where("mail", $mail);

    $results = $db->get("usuarios");

    global $jwt_enabled;

    if ($db->count > 0) {

        $hash = $results[0]['password'];
        if (password_verify($password, $hash)) {
            $results[0]['password'] = '';
            // Si la seguridad se encuentra habilitada, retorna el token y el usuario sin password
            if ($jwt_enabled) {
                echo json_encode(
                    array(
                        'token' => createToken(),
                        'user' => $results[0])
                );
            } else {
                echo json_encode(array('token' => '', 'user' => $results[0]));
            }
        } else {

            echo json_encode(-1);
        }
    } else {
        echo json_encode(-1);
    }


}

/* @name: checkLastLogin
 * @params: $userid
 * @description: --
 * todo: Este método podría volar, se puede verificar con jwt el último login.
 */
function checkLastLogin($userid)
{
    $db = new MysqliDb();
    $results = $db->rawQuery('select TIME_TO_SEC(TIMEDIFF(now(), last_login)) diferencia from usuarios where usuario_id = ' . $userid);

    if ($db->count < 1) {
        $db->rawQuery('update usuarios set token ="" where usuario_id =' . $userid);
        echo(json_encode(-1));
    } else {
        $diff = $results[0]["diferencia"];

        if (intval($diff) < 12960) {
            echo(json_encode($results[0]));
        } else {
            $db->rawQuery('update usuarios set token ="" where usuario_id =' . $userid);
            echo(json_encode(-1));
        }
    }
}

/* @name: create
 * @params: $user
 * @description: Crea un nuevo usuario y su dirección
 * todo: Sacar dirección, el usuario puede tener varias direcciones.
 */
function create($user)
{
    $db = new MysqliDb();
    $db->startTransaction();
    $user_decoded = checkUsuario(json_decode($user));
    $options = ['cost' => 12];
    $password = password_hash($user_decoded->password, PASSWORD_BCRYPT, $options);

    $data = array(
        'nombre' => $user_decoded->nombre,
        'apellido' => $user_decoded->apellido,
        'mail' => $user_decoded->mail,
        'nacionalidad_id' => $user_decoded->nacionalidad_id,
        'tipo_doc' => $user_decoded->tipo_doc,
        'nro_doc' => $user_decoded->nro_doc,
        'comentarios' => $user_decoded->comentarios,
        'marcado' => $user_decoded->marcado,
        'telefono' => $user_decoded->telefono,
        'fecha_nacimiento' => $user_decoded->fecha_nacimiento,
        'profesion_id' => $user_decoded->profesion_id,
        'saldo' => $user_decoded->saldo,
        'password' => $password,
        'rol_id' => $user_decoded->rol_id,
        'news_letter' => $user_decoded->news_letter
    );

    $result = $db->insert('usuarios', $data);
    if ($result > -1) {

        $data = array(
            'usuario_id' => $result,
            'calle' => $user_decoded->calle,
            'nro' => $user_decoded->nro,
            'piso' => $user_decoded->piso,
            'puerta' => $user_decoded->puerta,
            'ciudad_id' => $user_decoded->ciudad_id
        );

        $dir = $db->insert('direcciones', $data);

        if ($dir > -1) {
            $db->commit();
            echo json_encode($result);
        } else {
            $db->rollback();
            echo json_encode(-1);
        }
    } else {
        $db->rollback();
        echo json_encode(-1);
    }
}


/* @name: clientExist
 * @params: $mail
 * @description: Verifica si un usuario existe
 * todo:
 */
function userExist($mail)
{
    //Instancio la conexion con la DB
    $db = new MysqliDb();
    //Armo el filtro por email
    $db->where("mail", $mail);

    //Que me retorne el usuario filtrando por email
    $results = $db->get("usuarios");

    //retorno el resultado serializado
    if ($db->count > 0) {
        echo json_encode($db->count);
    } else {
        echo json_encode(-1);

    }
}


/* @name: changePassword
 * @params: $usuario_id, $pass_old, $pass_new
 * @description: Cambia el password, puede verificar que el anterior sea correcto o simplemente hacer un update
 * (pass_old == ''), depende de la seguridad que se requiera.
 * todo:
 */
function changePassword($usuario_id, $pass_old, $pass_new)
{
    $db = new MysqliDb();

    $db->where('usuario_id', $usuario_id);
    $results = $db->get("usuarios");

    if ($db->count > 0) {
        $result = $results[0];

        if ($pass_old == '' || password_verify($pass_old, $result['password'])) {

            $options = ['cost' => 12];
            $password = password_hash($pass_new, PASSWORD_BCRYPT, $options);

            $data = array('password' => $password);
            if ($db->update('usuarios', $data)) {
                echo json_encode(1);
            } else {
                echo json_encode(-1);
            }
        }
    } else {
        echo json_encode(-1);
    }
}


/* @name: create
 * @params: $user
 * @description: Update de usuario y dirección
 * todo: Sacar dirección, el usuario puede tener varias direcciones.
 */
function update($user)
{
    $db = new MysqliDb();
    $user_decoded = checkUsuario(json_decode($user));

    $db->where('usuario_id', $user_decoded->usuario_id);

    $data = array(
        'nombre' => $user_decoded->nombre,
        'apellido' => $user_decoded->apellido,
        'mail' => $user_decoded->mail,
        'nacionalidad_id' => $user_decoded->nacionalidad_id,
        'tipo_doc' => $user_decoded->tipo_doc,
        'nro_doc' => $user_decoded->nro_doc,
        'comentarios' => $user_decoded->comentarios,
        'marcado' => $user_decoded->marcado,
        'telefono' => $user_decoded->telefono,
        'fecha_nacimiento' => $user_decoded->fecha_nacimiento,
        'profesion_id' => $user_decoded->profesion_id,
        'saldo' => $user_decoded->saldo,
        'rol_id' => $user_decoded->rol_id,
        'news_letter' => $user_decoded->news_letter
    );

    if ($user_decoded->password != '') {
        changePassword($user_decoded->usuario_id, '', $user_decoded->password);
    }

    if ($db->update('usuarios', $data)) {


        $db->where('usuario_id', $user_decoded->usuario_id);
        $data = array(
            'calle' => $user_decoded->calle,
            'nro' => $user_decoded->nro,
            'piso' => $user_decoded->piso,
            'puerta' => $user_decoded->puerta,
            'ciudad_id' => $user_decoded->ciudad_id
        );

        $dir = $db->update('direcciones', $data);

        if ($dir) {
            echo json_encode(1);
        } else {
            echo json_encode(-1);
        }

    } else {
        echo json_encode(-1);
    }
}

/**
 * @description Verifica todos los campos de usuario para que existan
 * @param $usuario
 * @return mixed
 */
function checkUsuario($usuario) {
    
    $usuario->nombre = (array_key_exists("nombre" , $usuario)) ? '' : $usuario->nombre;
    $usuario->apellido = (array_key_exists("apellido" , $usuario)) ? '' : $usuario->apellido;
    $usuario->mail = (array_key_exists("mail" , $usuario)) ? '' : $usuario->mail;
    $usuario->nacionalidad_id = (array_key_exists("nacionalidad_id" , $usuario)) ? '' : $usuario->nacionalidad_id;
    $usuario->tipo_doc = (array_key_exists("tipo_doc" , $usuario)) ? '' : $usuario->tipo_doc;
    $usuario->nro_doc = (array_key_exists("nro_doc" , $usuario)) ? '' : $usuario->nro_doc;
    $usuario->comentarios = (array_key_exists("comentarios" , $usuario)) ? '' : $usuario->comentarios;
    $usuario->marcado = (array_key_exists("marcado" , $usuario)) ? '' : $usuario->marcado;
    $usuario->telefono = (array_key_exists("telefono" , $usuario)) ? '' : $usuario->telefono;
    $usuario->fecha_nacimiento = (array_key_exists("fecha_nacimiento" , $usuario)) ? '' : $usuario->fecha_nacimiento;
    $usuario->profesion_id = (array_key_exists("profesion_id" , $usuario)) ? '' : $usuario->profesion_id;
    $usuario->saldo = (array_key_exists("saldo" , $usuario)) ? '' : $usuario->saldo;
    $usuario->password = (array_key_exists("password" , $usuario)) ? '' : $usuario->password;
    $usuario->rol_id = (array_key_exists("rol_id" , $usuario)) ? '' : $usuario->rol_id;
    $usuario->news_letter = (array_key_exists("news_letter" , $usuario)) ? '' : $usuario->news_letter;

    return $usuario;
}