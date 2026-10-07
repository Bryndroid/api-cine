import { HttpError, asyncHandler } from "../errors.js";
import {
  createReservation as createReservationService,
  getReservation as getReservationService,
  listReservations as listReservationsService,
  validateReservationByCode,
} from "../services/reservas.service.js";
import {
  validateFunctionDateTime,
  validatePositiveId,
  validateReservation,
} from "../validation.js";

export const listReservations = asyncHandler(async (req, res) => {
  let peliculaId;
  let sala;
  let fechaIniciacionFuncion;

  if (req.query.pelicula_id !== undefined) {
    peliculaId = validatePositiveId(req.query.pelicula_id, "pelicula_id");
  }
  if (req.query.sala !== undefined) {
    if (typeof req.query.sala !== "string" || req.query.sala.trim() === "") {
      throw new HttpError(400, "El filtro 'sala' no puede estar vacío.");
    }
    sala = req.query.sala.trim();
  }
  if (req.query.fecha_iniciacion_funcion !== undefined) {
    fechaIniciacionFuncion = validateFunctionDateTime(req.query.fecha_iniciacion_funcion);
  }

  res.json(await listReservationsService({ peliculaId, sala, fechaIniciacionFuncion }));
});

export const getReservation = asyncHandler(async (req, res) => {
  res.json(await getReservationService(validatePositiveId(req.params.id)));
});

export const createReservation = asyncHandler(async (req, res) => {
  res.status(201).json(await createReservationService(validateReservation(req.body)));
});

export const validateReservationController = asyncHandler(async (req, res) => {
  if (typeof req.params.codigo !== "string" || req.params.codigo.trim() === "") {
    throw new HttpError(400, "El código de la reserva es obligatorio.");
  }
  res.json(await validateReservationByCode(req.params.codigo.trim()));
});

export function handleReservationErrors(error, req, res, next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }

  const serviceErrorStatuses = new Map([
    ["Película no encontrada.", 404],
    ["Reserva no encontrada.", 404],
    ["La película no está disponible.", 409],
    ["La sala de la reserva debe coincidir con la sala de la película.", 400],
    ["La hora de inicio de la reserva debe coincidir con la hora de la película.", 400],
    ["No fue posible generar un código único para la reserva.", 409],
    ["La reserva ya fue utilizada.", 409],
  ]);
  const status = serviceErrorStatuses.get(error.message);
  if (status) {
    return res.status(status).json({ error: error.message });
  }
  if (error.message.startsWith("Asientos ocupados:")) {
    return res.status(409).json({ error: error.message });
  }

  return next(error);
}