import express from "express";
import logger from "./utils/logger";
import cors from "cors";
import mainRouter from "./routes";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supabaseMiddleware } from "./middleware/supabaseMiddleware";
import { apiKeyMiddleware } from "./middleware/apiKeyMiddleware";
import { Config } from "./config/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation",
    },
  },
  apis: [join(__dirname, "routes/**/*.ts"), join(__dirname, "../dist/routes/**/*.js")],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
if (!Config.IS_LOCAL_MODE) app.use(apiKeyMiddleware);
if (!Config.IS_CI) app.use(supabaseMiddleware);
app.use("/", mainRouter);

export default app;

if (process.argv[1] === __filename) {
  app.listen(port, () => {
    logger.info(`API listening on http://localhost:${port}`);
    logger.info(`Docs at http://localhost:${port}/docs`);
  });
}

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection");
});
