import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  defaultMeta: { service: "yield-liquidator" },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "liquidator.log" })
  ]
});
