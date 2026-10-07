import express from "express";
import peliculasRoutes from "./routes/peliculas.routes.js";
import reservasRoutes from "./routes/reservas.routes.js";

const app = express();

app.use(express.json());
app.use("/peliculas", peliculasRoutes);
app.use("/reservas", reservasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la solicitud no es JSON válido." });
  }

  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor." });
});

export default app;
