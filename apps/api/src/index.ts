// apps/api/src/index.ts
import express from "express";
import mainRouter from "./routes/index.js"; // include .js if using ESM path resolution
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Build absolute globs so moving folders doesn’t break docs
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

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // you can add { explorer: true } as 3rd arg
app.use(express.json());
app.use("/", mainRouter);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Docs at http://localhost:${port}/docs`);
});
