import { Router } from "express";
import {
  createReservation,
  getReservation,
  handleReservationErrors,
  listReservations,
  validateReservationController,
} from "../controllers/reservas.controllers.js";

const router = Router();

router.get("/", listReservations);
router.get("/:id", getReservation);
router.post("/", createReservation);
router.put("/:codigo/validar", validateReservationController);
router.use(handleReservationErrors);

export default router;