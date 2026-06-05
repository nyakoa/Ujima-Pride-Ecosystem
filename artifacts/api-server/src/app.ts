import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http"; // Fixed: Changed to named import
import router from "./routes";
import { logger } from "./lib/logger";
import type { IncomingMessage, ServerResponse } from "http"; // Added for serializer types

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      // Fixed: Added explicit typing to 'req'
      req(req: IncomingMessage & { id?: string | number }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      // Fixed: Added explicit typing to 'res'
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
