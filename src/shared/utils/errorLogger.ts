/**
 * Centralized error logging utility
 * Extensible to send to external services (Sentry, LogRocket, etc.)
 */

interface ErrorLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 50; // Keep last 50 logs in memory

  /**
   * Log an error
   */
  error(message: string, context?: Record<string, any>, error?: Error) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
      stack: error?.stack,
    };

    this.addLog(entry);
    console.error(`[ERROR] ${message}`, { context, error });

    // TODO: Send to Sentry or external service
    // sentryClient.captureException(error, { extra: context });
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: Record<string, any>) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };

    this.addLog(entry);
    console.warn(`[WARN] ${message}`, context);

    // TODO: Send to external service if needed
  }

  /**
   * Log info
   */
  info(message: string, context?: Record<string, any>) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };

    this.addLog(entry);
  }

  /**
   * Get all logged errors
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Add log entry with size limit
   */
  private addLog(entry: ErrorLogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest
    }
  }
}

export const errorLogger = new ErrorLogger();
