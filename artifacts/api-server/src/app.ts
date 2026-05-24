import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import router from "./routes";

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/api", router);

const frontendDist =
  process.env.FRONTEND_DIST ??
  path.join(process.cwd(), "artifacts/writers-room/dist/public");

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
