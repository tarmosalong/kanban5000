import pino from 'pino';

/**
 * Logger configuration options.
 */
export interface LoggerOptions {
  level?: string;
  name?: string;
  pretty?: boolean;
}

/**
 * Create a Pino logger instance.
 */
export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const { level = 'info', name = 'kanban5000', pretty = process.env.NODE_ENV !== 'production' } =
    options;

  const transport = pretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

  return pino({
    name,
    level,
    transport,
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

/**
 * Logger type export.
 */
export type Logger = pino.Logger;

