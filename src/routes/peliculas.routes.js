import { Router } from "express";
import {
  createMovie,
  deleteMovie,
  getMovie,
  handleMovieErrors,
  listMovies,
  updateMovie,
} from "../controllers/peliculas.controllers.js";

const router = Router();

router.get("/", listMovies);
router.get("/:id", getMovie);
router.post("/", createMovie);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);
router.use(handleMovieErrors);

export default router;