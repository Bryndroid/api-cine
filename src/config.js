import "dotenv/config";

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un número entre 1 y 65535.");
}

const dbPort = Number(process.env.DB_PORT || 3306);

if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
  throw new Error("DB_PORT debe ser un número entre 1 y 65535.");
}

export default {
  port,
  database: {
    host: process.env.DB_HOST || "localhost",
    port: dbPort,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "api_cine",
  },
};