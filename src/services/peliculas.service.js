import pool from "../db.js";

const movieColumns = "id, codigo, nombre, genero, duracion, clasificacion, sala, hora_inicio, hora_finalizacion, img_ref, precio, estado";

export function calculateEndTime(startTime, duration) {
  const [hours, minutes, seconds] = startTime.split(":").map(Number);
  const endSeconds = (hours * 3600 + minutes * 60 + seconds + duration * 60) % 86400;
  const endHours = Math.floor(endSeconds / 3600);
  const endMinutes = Math.floor((endSeconds % 3600) / 60);
  const endRemainder = endSeconds % 60;
  return [endHours, endMinutes, endRemainder]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

const movieValues = (movie) => [
  movie.codigo,
  movie.nombre,
  movie.genero,
  movie.duracion,
  movie.clasificacion,
  movie.sala,
  movie.hora_inicio,
  calculateEndTime(movie.hora_inicio, movie.duracion),
  movie.img_ref,
  movie.precio,
  movie.estado,
];

function handleDuplicateCode(error) {
  if (error.code === "ER_DUP_ENTRY") {
    throw new Error("Ya existe una película con ese código.");
  }
  throw error;
}

export async function listMovies() {
  const [rows] = await pool.execute(`SELECT ${movieColumns} FROM peliculas ORDER BY id`);
  return rows;
}

export async function getMovie(id) {
  const [rows] = await pool.execute(
    `SELECT ${movieColumns} FROM peliculas WHERE id = ?`,
    [id],
  );
  if (rows.length === 0) {
    throw new Error("Película no encontrada.");
  }
  return rows[0];
}

export async function createMovie(movie) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO peliculas
        (codigo, nombre, genero, duracion, clasificacion, sala, hora_inicio,
         hora_finalizacion, img_ref, precio, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      movieValues(movie),
    );
    return await getMovie(result.insertId);
  } catch (error) {
    handleDuplicateCode(error);
  }
}

export async function updateMovie(id, movie) {
  try {
    const [result] = await pool.execute(
      `UPDATE peliculas
       SET codigo = ?, nombre = ?, genero = ?, duracion = ?, clasificacion = ?,
           sala = ?, hora_inicio = ?, hora_finalizacion = ?, img_ref = ?,
           precio = ?, estado = ?
       WHERE id = ?`,
      [...movieValues(movie), id],
    );

    if (result.affectedRows === 0) {
      await getMovie(id);
    }

    return await getMovie(id);
  } catch (error) {
    handleDuplicateCode(error);
  }
}

export async function deleteMovie(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [movies] = await connection.execute(
      "SELECT id FROM peliculas WHERE id = ? FOR UPDATE",
      [id],
    );
    if (movies.length === 0) {
      throw new Error("Película no encontrada.");
    }

    const [reservations] = await connection.execute(
      "SELECT id FROM reservas WHERE pelicula_id = ? LIMIT 1",
      [id],
    );
    if (reservations.length > 0) {
      throw new Error("No se puede eliminar una película con reservas.");
    }

    await connection.execute("DELETE FROM peliculas WHERE id = ?", [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}