import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../src/errors.js";
import { calculateEndTime } from "../src/services/peliculas.service.js";
import { validateMovie, validateReservation } from "../src/validation.js";

const movie = {
  codigo: "CINE-001",
  nombre: "Prueba",
  genero: "Drama",
  duracion: 120,
  clasificacion: "B",
  sala: "Sala 1",
  hora_inicio: "10:00:00",
  img_ref: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&h=900&q=80",
  precio: 85.5,
  estado: "Disponible",
};

test("valida una película completa", () => {
  assert.deepEqual(validateMovie(movie), movie);
});

test("normaliza la hora de inicio y calcula correctamente la hora final", () => {
  assert.equal(validateMovie({ ...movie, hora_inicio: "10:30" }).hora_inicio, "10:30:00");
  assert.equal(calculateEndTime("10:30:00", 95), "12:05:00");
  assert.equal(calculateEndTime("23:30:00", 90), "01:00:00");
});

test("rechaza campos obligatorios faltantes o inválidos", () => {
  assert.throws(() => validateMovie({ ...movie, codigo: "" }), HttpError);
  assert.throws(() => validateMovie({ ...movie, precio: -1 }), HttpError);
  assert.throws(() => validateMovie({ ...movie, precio: null }), HttpError);
  assert.throws(() => validateMovie({ ...movie, estado: "Activa" }), HttpError);
  assert.throws(() => validateMovie({ ...movie, genero: undefined }), HttpError);
  assert.throws(() => validateMovie({ ...movie, hora_inicio: "24:00" }), HttpError);
  assert.throws(() => validateMovie({ ...movie, img_ref: "not-a-url" }), HttpError);
  assert.throws(() => validateMovie({ ...movie, img_ref: "javascript:alert(1)" }), HttpError);
});

test("normaliza y valida asientos de una reserva", () => {
  assert.deepEqual(
    validateReservation({
      pelicula_id: 3,
      nombre_cliente: "Cliente",
      sala: "Sala 1",
      fecha_iniciacion_funcion: "2026-10-05 20:00:00",
      asientos: ["a1", "A2"],
    }),
    {
      peliculaId: 3,
      nombreCliente: "Cliente",
      sala: "Sala 1",
      fechaIniciacionFuncion: "2026-10-05 20:00:00",
      asientos: ["A1", "A2"],
    },
  );
});

test("rechaza una reserva sin campos válidos o con asientos duplicados", () => {
  assert.throws(
    () => validateReservation({
      pelicula_id: 0,
      nombre_cliente: "Cliente",
      sala: "Sala 1",
      fecha_iniciacion_funcion: "2026-10-05 20:00:00",
      asientos: "A1",
    }),
    HttpError,
  );
  assert.throws(
    () => validateReservation({
      pelicula_id: 1,
      nombre_cliente: "Cliente",
      sala: "Sala 1",
      fecha_iniciacion_funcion: "2026-10-05 20:00:00",
      asientos: ["A1", "a1"],
    }),
    HttpError,
  );
});

test("rechaza fechas inexistentes para la función", () => {
  assert.throws(() => validateReservation({
    pelicula_id: 1,
    nombre_cliente: "Cliente",
    sala: "Sala 1",
    fecha_iniciacion_funcion: "2026-02-30 20:00:00",
    asientos: "A1",
  }), HttpError);
});
