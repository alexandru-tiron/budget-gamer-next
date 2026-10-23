import { env } from "~/env";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Create a logger that adds `bindings` (e.g. `{ scope: "epic-games" }`) to every entry. */
  child(bindings: LogContext): Logger;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProduction = env.NODE_ENV === "production";
const minLevel: LogLevel = env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

/**
 * Turn errors into plain objects so they survive JSON.stringify.
 */
export function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) return error;
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error.cause !== undefined && { cause: serializeError(error.cause) }),
  };
}

/**
 * Build a single log entry. Exported for tests.
 */
export function formatEntry(
  level: LogLevel,
  message: string,
  context: LogContext,
  time: Date = new Date(),
): Record<string, unknown> {
  const fields = Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, serializeError(value)]),
  );
  return { level, time: time.toISOString(), msg: message, ...fields };
}

function write(
  level: LogLevel,
  bindings: LogContext,
  message: string,
  context: LogContext = {},
) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) return;

  const sink =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  const entry = formatEntry(level, message, { ...bindings, ...context });

  if (isProduction) {
    // One JSON object per line, so Vercel's log search can filter on fields
    let line: string;
    try {
      line = JSON.stringify(entry);
    } catch {
      line = JSON.stringify({ level, time: entry.time, msg: message });
    }
    sink(line);
    return;
  }

  const { level: _level, time: _time, msg: _msg, scope, ...fields } = entry;
  const prefix = typeof scope === "string" ? `[${scope}] ` : "";
  const extra = Object.keys(fields).length > 0 ? [fields] : [];
  sink(`${level.toUpperCase()} ${prefix}${message}`, ...extra);
}

export function createLogger(bindings: LogContext = {}): Logger {
  return {
    debug: (message, context) => write("debug", bindings, message, context),
    info: (message, context) => write("info", bindings, message, context),
    warn: (message, context) => write("warn", bindings, message, context),
    error: (message, context) => write("error", bindings, message, context),
    child: (more) => createLogger({ ...bindings, ...more }),
  };
}

export const logger = createLogger();
