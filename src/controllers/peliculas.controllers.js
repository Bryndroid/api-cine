import { HttpError, asyncHandler } from "../errors.js";
import {
  createMovie as createMovieService,
  deleteMovie as deleteMovieService,
  getMovie as getMovieService,
  listMovies as listMoviesService,
  updateMovie as updateMovieService,
} from "../services/peliculas.service.js";
import { validateMovie, validatePositiveId } from "../validation.js";

export const listMovies = asyncHandler(async (req, res) => {
  res.json(await listMoviesService());
});

export const getMovie = asyncHandler(async (req, res) => {
  res.json(await getMovieService(validatePositiveId(req.params.id)));
});

export const createMovie = asyncHandler(async (req, res) => {
  res.status(201).json(await createMovieService(validateMovie(req.body)));
});

export const updateMovie = asyncHandler(async (req, res) => {
  const id = validatePositiveId(req.params.id);
  res.json(await updateMovieService(id, validateMovie(req.body)));
});

export const deleteMovie = asyncHandler(async (req, res) => {
  await deleteMovieService(validatePositiveId(req.params.id));
  res.status(204).end();
});

export function handleMovieErrors(error, req, res, next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }

  const serviceErrorStatuses = new Map([
    ["Película no encontrada.", 404],
    ["Ya existe una película con ese código.", 409],
    ["No se puede eliminar una película con reservas.", 409],
  ]);
  const status = serviceErrorStatuses.get(error.message);
  if (status) {
    return res.status(status).json({ error: error.message });
  }

  return next(error);
}