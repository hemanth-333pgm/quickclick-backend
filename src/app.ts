import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { config } from "./config/env";
import { connectDatabase } from "./config/database";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
    }));
    this.app.use(compression());
    this.app.use(morgan("combined"));
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
    });

    // API routes will be added here
    this.app.get(`${config.apiPrefix}/ping`, (req: Request, res: Response) => {
      res.status(200).json({ message: "pong" });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong",
        },
      });
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

export default new App().getApp();
