import cors from "cors";
<<<<<<< HEAD
import swaggerUi from "swagger-ui-express";
=======
import express from "express";
>>>>>>> origin/main
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { openapi } from "./docs/swagger";
import routes from "./routes";

const app = express();

app.disable("x-powered-by");

// Only our own frontend may call the API from a browser
const allowedOrigins: string[] = [];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
if (process.env.NODE_ENV !== "production") allowedOrigins.push("http://localhost:5173");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", routes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: "TeamBoard API Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);
app.get("/openapi.json", (_req, res) => {
  res.json(openapi);
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
