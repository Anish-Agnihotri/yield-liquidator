import winston from "winston";

// Setup winston logger
export const logger = winston.createLogger({
  level: "info",
  // Simple line-by-line output
  format: winston.format.simple(),
  transports: [
    // Print to console
    new winston.transports.Console(),
    // + Output to liquidator logfile
    new winston.transports.File({ filename: "liquidator.log" })
  ]
});
