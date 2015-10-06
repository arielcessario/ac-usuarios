<?php

// JWT Secret Key
$secret = 'uiglp';
// JWT AUD
$serverName = 'serverName';
// false local / true production
$jwt_enabled = false;

/* @name: checkSecurity
 * @param
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