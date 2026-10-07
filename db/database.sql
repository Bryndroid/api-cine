CREATE DATABASE IF NOT EXISTS api_cine
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE api_cine;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(190) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS peliculas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(180) NOT NULL,
  genero VARCHAR(80) NOT NULL,
  duracion SMALLINT UNSIGNED NOT NULL,
  clasificacion VARCHAR(30) NOT NULL,
  sala VARCHAR(80) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_finalizacion TIME NOT NULL,
  img_ref VARCHAR(2048) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  estado ENUM('Disponible', 'No disponible') NOT NULL DEFAULT 'Disponible',
  PRIMARY KEY (id),
  UNIQUE KEY uq_peliculas_codigo (codigo),
  CONSTRAINT chk_peliculas_precio CHECK (precio >= 0),
  CONSTRAINT chk_peliculas_duracion CHECK (duracion > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo CHAR(32) NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  pelicula_id INT UNSIGNED NOT NULL,
  nombre_cliente VARCHAR(150) NOT NULL,
  sala VARCHAR(80) NOT NULL,
  fecha_iniciacion_funcion DATETIME NOT NULL,
  asientos VARCHAR(1000) NOT NULL,
  cantidad SMALLINT UNSIGNED NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  utilizado TINYINT(1) NOT NULL DEFAULT 0,
  fecha_compra TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reservas_codigo (codigo),
  KEY idx_reservas_pelicula_funcion
    (pelicula_id, sala, fecha_iniciacion_funcion),
  CONSTRAINT chk_reservas_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_reservas_total CHECK (total >= 0),
  CONSTRAINT chk_reservas_utilizado CHECK (utilizado IN (0, 1)),
  CONSTRAINT fk_reservas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reservas_pelicula
    FOREIGN KEY (pelicula_id) REFERENCES peliculas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO peliculas
  (codigo, nombre, genero, duracion, clasificacion, sala, hora_inicio,
   hora_finalizacion, img_ref, precio, estado)
VALUES
  ('PEL-001', 'Horizonte de cristal', 'Acción', 120, 'B', 'Sala 1',
   '10:00:00', '12:00:00',
   'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&h=900&q=80',
   85.50, 'Disponible'),
  ('PEL-002', 'La última carcajada', 'Comedia', 95, 'B', 'Sala 2',
   '12:30:00', '14:05:00',
   'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&h=900&q=80',
   75.00, 'Disponible'),
  ('PEL-003', 'Cartas al invierno', 'Drama', 110, 'B', 'Sala 3',
   '15:00:00', '16:50:00',
   'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&h=900&q=80',
   80.00, 'Disponible'),
  ('PEL-004', 'Órbita distante', 'Ciencia ficción', 130, 'B', 'Sala 4',
   '18:00:00', '20:10:00',
   'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&h=900&q=80',
   95.00, 'Disponible'),
  ('PEL-005', 'La casa del eco', 'Terror', 100, 'C', 'Sala 5',
   '21:00:00', '22:40:00',
   'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&h=900&q=80',
   90.00, 'Disponible')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  genero = VALUES(genero),
  duracion = VALUES(duracion),
  clasificacion = VALUES(clasificacion),
  sala = VALUES(sala),
  hora_inicio = VALUES(hora_inicio),
  hora_finalizacion = VALUES(hora_finalizacion),
  img_ref = VALUES(img_ref),
  precio = VALUES(precio),
  estado = VALUES(estado);

INSERT INTO usuarios (id, nombre, correo)
VALUES (1, 'Usuario genérico', 'generico@api-cine.local') AS new
ON DUPLICATE KEY UPDATE
  nombre = new.nombre,
  correo = new.correo;