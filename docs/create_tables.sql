
# USUARIOS
CREATE TABLE usuarios (
  usuario_id int(11) NOT NULL AUTO_INCREMENT,
  nombre varchar(100) NOT NULL,
  apellido varchar(100) NOT NULL,
  mail varchar(100) NOT NULL,
  nacionalidad_id int(11) DEFAULT NULL,
  tipo_doc int(11) NOT NULL,
  nro_doc varchar(20) NOT NULL,
  comentarios varchar(450) DEFAULT NULL,
  marcado varchar(8) DEFAULT NULL,
  telefono varchar(45) DEFAULT NULL,
  fecha_nacimiento varchar(45) DEFAULT NULL,
  profesion_id int(11) DEFAULT NULL,
  saldo varchar(8) NOT NULL DEFAULT '0.0',
  password varchar(100) DEFAULT NULL,
  rol_id int(11) NOT NULL DEFAULT '0', -- TODO: Just for now: 0 - Admin; 1 - Usuario; 2 - Proveedor; 3 - Cliente
  news_letter int(1) DEFAULT NULL,
  cbu varchar(20) DEFAULT NULL,
  social_login int(1) DEFAULT 0 COMMENT 'Especifica si utiliza una cuenta social para logearse | 0: no, 1:google, 2:facebook',
  PRIMARY KEY (usuario_id)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

# DIRECCIONES
CREATE TABLE direcciones (
  direccion_id int(11) NOT NULL AUTO_INCREMENT,
  usuario_id int(11) DEFAULT NULL,
  calle varchar(150) NOT NULL,
  nro int(11) NOT NULL,
  piso int(3) default null,
  puerta varchar(3) default NULL ,
  ciudad_id int(11) default null,
  PRIMARY KEY (direccion_id)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

# HISTORICO DE LOGIN
CREATE TABLE logins (
  login_id int(11) NOT NULL AUTO_INCREMENT,
  usuario_id int(11) DEFAULT NULL,
  sucursal_id varchar(45) NOT NULL,
  ok int(1) NOT NULL DEFAULT 0,  -- Login no ok == 0 / Login ok == 1
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (login_id)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;