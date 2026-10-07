import { HttpError } from "./errors.js";

const movieStates = new Set(["Disponible", "No disponible"]);
const movieFields = [
  "codigo",
  "nombre",
  "genero",
  "duracion",
  "clasificacion",
  "sala",
  "hora_inicio",
  "img_ref",
  "precio",
  "estado",
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `El campo '${field}' es obligatorio y debe ser texto.`);
  }

  return value.trim();
}

export function validateMovie(body) {
  if (!isObject(body)) {
    throw new HttpError(400, "El cuerpo debe ser un objeto JSON.");
  }

  for (const field of movieFields) {
    if (!Object.hasOwn(body, field)) {
      throw new HttpError(400, `Falta el campo obligatorio '${field}'.`);
    }
  }

  const movie = {
    codigo: requiredText(body.codigo, "codigo"),
    nombre: requiredText(body.nombre, "nombre"),
    genero: requiredText(body.genero, "genero"),
    duracion: body.duracion,
    clasificacion: requiredText(body.clasificacion, "clasificacion"),
    sala: requiredText(body.sala, "sala"),
    hora_inicio: body.hora_inicio,
    img_ref: validateImageUrl(body.img_ref),
    precio: body.precio,
    estado: requiredText(body.estado, "estado"),
  };

  if (typeof movie.duracion !== "number" || !Number.isInteger(movie.duracion) || movie.duracion <= 0) {
    throw new HttpError(400, "El campo 'duracion' debe ser un entero mayor que cero.");
  }

  if (typeof movie.hora_inicio !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(movie.hora_inicio)) {
    throw new HttpError(400, "El campo 'hora_inicio' debe tener formato de 24 horas HH:mm o HH:mm:ss.");
  }
  if (movie.hora_inicio.length === 5) {
    movie.hora_inicio = `${movie.hora_inicio}:00`;
  }

  if (typeof movie.precio !== "number" || !Number.isFinite(movie.precio) || movie.precio < 0) {
    throw new HttpError(400, "El campo 'precio' debe ser un número mayor o igual a cero.");
  }

  if (!movieStates.has(movie.estado)) {
    throw new HttpError(400, "El campo 'estado' debe ser 'Disponible' o 'No disponible'.");
  }

  return movie;
}

function validateImageUrl(value) {
  const imageUrl = requiredText(value, "img_ref");
  let parsedUrl;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new HttpError(400, "El campo 'img_ref' debe ser una URL válida.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new HttpError(400, "El campo 'img_ref' debe usar HTTP o HTTPS.");
  }

  return imageUrl;
}

export function validatePositiveId(value, field = "id") {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `El campo '${field}' debe ser un entero positivo.`);
  }
  return id;
}

export function validateReservation(body) {
  if (!isObject(body)) {
    throw new HttpError(400, "El cuerpo debe ser un objeto JSON.");
  }

  const peliculaId = validatePositiveId(body.pelicula_id, "pelicula_id");
  const nombreCliente = requiredText(body.nombre_cliente, "nombre_cliente");
  const sala = requiredText(body.sala, "sala");
  const fechaIniciacionFuncion = validateFunctionDateTime(
    body.fecha_iniciacion_funcion,
  );
  
  const rawSeats = Array.isArray(body.asientos) ? body.asientos : [body.asientos];

  if (rawSeats.length === 0) {
    throw new HttpError(400, "Debe indicar al menos un asiento.");
  }

  const asientos = rawSeats.map((seat) => {
   
    if (typeof seat !== "string" || !/^[a-z]\d+$/i.test(seat.trim())) {
      throw new HttpError(400, "Cada asiento debe tener el formato A1, A2, etc.");
    }
    return seat.trim().toUpperCase();
  });

  if (new Set(asientos).size !== asientos.length) {
    throw new HttpError(400, "La solicitud contiene asientos repetidos.");
  }

  return { peliculaId, nombreCliente, sala, fechaIniciacionFuncion, asientos };
}

export function validateFunctionDateTime(value) {
  const dateTime = requiredText(value, "fecha_iniciacion_funcion");
  const match = /^(\d{4})-(\d{2})-(\d{2}) ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.exec(dateTime);
  if (!match) {
    throw new HttpError(
      400,
      "El campo 'fecha_iniciacion_funcion' debe tener formato YYYY-MM-DD HH:mm:ss.",
    );
  }

  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() + 1 !== Number(month)
    || date.getUTCDate() !== Number(day)
  ) {
    throw new HttpError(400, "El campo 'fecha_iniciacion_funcion' no contiene una fecha válida.");
  }

  return dateTime;
}
