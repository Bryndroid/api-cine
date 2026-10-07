import { randomUUID } from "node:crypto";
import pool from "../db.js";

function parseSeats(value) {
  return String(value)
    .split(",")
    .map((seat) => seat.trim().toUpperCase())
    .filter(Boolean);
}

function handleDuplicateCode(error) {
  if (error.code === "ER_DUP_ENTRY") {
    throw new Error("No fue posible generar un código único para la reserva.");
  }
  throw error;
}

export async function listReservations(filters) {
  const conditions = [];
  const values = [];

  if (filters.peliculaId !== undefined) {
    conditions.push("pelicula_id = ?");
    values.push(filters.peliculaId);
  }
  if (filters.sala !== undefined) {
    conditions.push("sala = ?");
    values.push(filters.sala);
  }
  if (filters.fechaIniciacionFuncion !== undefined) {
    conditions.push("fecha_iniciacion_funcion = ?");
    values.push(filters.fechaIniciacionFuncion);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT id, codigo, usuario_id, pelicula_id, nombre_cliente, sala,
            fecha_iniciacion_funcion, asientos, cantidad, total, utilizado, fecha_compra
     FROM reservas${where} ORDER BY id`,
    values,
  );
  return rows;
}

export async function getReservation(id) {
  const [rows] = await pool.execute(
    `SELECT id, codigo, usuario_id, pelicula_id, nombre_cliente, sala,
            fecha_iniciacion_funcion, asientos, cantidad, total, utilizado, fecha_compra
     FROM reservas WHERE id = ?`,
    [id],
  );
  if (rows.length === 0) {
    throw new Error("Reserva no encontrada.");
  }
  return rows[0];
}

export async function createReservation({
  peliculaId,
  nombreCliente,
  sala,
  fechaIniciacionFuncion,
  asientos,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [movies] = await connection.execute(
      "SELECT id, precio, estado, sala, hora_inicio FROM peliculas WHERE id = ? FOR UPDATE",
      [peliculaId],
    );
    if (movies.length === 0) {
      throw new Error("Película no encontrada.");
    }
    if (movies[0].estado !== "Disponible") {
      throw new Error("La película no está disponible.");
    }
    if (movies[0].sala !== sala) {
      throw new Error("La sala de la reserva debe coincidir con la sala de la película.");
    }
    if (String(movies[0].hora_inicio).slice(0, 8) !== fechaIniciacionFuncion.slice(11, 19)) {
      throw new Error("La hora de inicio de la reserva debe coincidir con la hora de la película.");
    }

    const [existing] = await connection.execute(
      `SELECT asientos FROM reservas
       WHERE pelicula_id = ? AND sala = ? AND fecha_iniciacion_funcion = ?`,
      [peliculaId, sala, fechaIniciacionFuncion],
    );
    const occupied = new Set(existing.flatMap((reservation) => parseSeats(reservation.asientos)));
    const conflictingSeats = asientos.filter((seat) => occupied.has(seat));

    if (conflictingSeats.length > 0) {
      throw new Error(`Asientos ocupados: ${conflictingSeats.join(", ")}.`);
    }

    const [users] = await connection.execute("SELECT id FROM usuarios WHERE id = 1");
    if (users.length === 0) {
      throw new Error("No existe el usuario genérico. Ejecuta el script db/database.sql.");
    }

    const codigo = randomUUID().replaceAll("-", "").toUpperCase();
    const cantidad = asientos.length;
    const total = Math.round(movies[0].precio * cantidad * 100) / 100;
    const [result] = await connection.execute(
      `INSERT INTO reservas
        (codigo, usuario_id, pelicula_id, nombre_cliente, sala,
         fecha_iniciacion_funcion, asientos, cantidad, total, utilizado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        codigo,
        users[0].id,
        peliculaId,
        nombreCliente,
        sala,
        fechaIniciacionFuncion,
        asientos.join(","),
        cantidad,
        total,
      ],
    );

    const [reservations] = await connection.execute(
      `SELECT id, codigo, usuario_id, pelicula_id, nombre_cliente, sala,
              fecha_iniciacion_funcion, asientos, cantidad, total, utilizado, fecha_compra
       FROM reservas WHERE id = ?`,
      [result.insertId],
    );
    await connection.commit();
    return reservations[0];
  } catch (error) {
    await connection.rollback();
    handleDuplicateCode(error);
  } finally {
    connection.release();
  }
}

export async function validateReservationByCode(codigo) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, utilizado FROM reservas WHERE codigo = ? FOR UPDATE",
      [codigo],
    );
    if (rows.length === 0) {
      throw new Error("Reserva no encontrada.");
    }
    if (Boolean(rows[0].utilizado)) {
      throw new Error("La reserva ya fue utilizada.");
    }

    await connection.execute("UPDATE reservas SET utilizado = 1 WHERE id = ?", [rows[0].id]);
    await connection.commit();
    return { id: rows[0].id, codigo, utilizado: 1 };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}