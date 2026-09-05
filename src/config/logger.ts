import winston from "winston";
import { config } from "./env";
import fs from "fs";

// Ensure logs directory exists
if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs", { recursive: true });
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, requestId, ...metadata }) => {
        let msg = `${timestamp} [${level}]`;
        if (requestId) {
            msg += ` [${requestId}]`;
        }
        msg += `: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

export const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            ),
        }),
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 10485760,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 10485760,
            maxFiles: 5,
        }),
    ],
    exitOnError: false,
});
