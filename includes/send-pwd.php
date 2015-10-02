<?php
/**
 * Created by PhpStorm.
 * User: emaneff
 * Date: 28/04/2015
 * Time: 01:33 PM
 * Send a email with a new password
 */

$data = file_get_contents("php://input");

$decoded = json_decode($data);

sendMail($decoded->email, $decoded->mensaje);

function sendMail($email, $mensaje){
    // message lines should not exceed 70 characters (PHP rule), so wrap it
    //$mensaje = wordwrap("Mensaje de ". $nombre . "\n Cuerpo del mensaje: " . $mensaje, 100);
    // send mail
    $success = mail($email, 'Recuperar contraseña', $mensaje, "UIGLP");

    echo json_encode( $success );

    //echo ($email . $nombre . $mensaje . $asunto);
}