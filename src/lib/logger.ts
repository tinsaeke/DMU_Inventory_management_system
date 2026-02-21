type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private createLogEntry(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  info(message: string, data?: unknown, context?: string) {
    const entry = this.createLogEntry('info', message, data, context);
    this.addLog(entry);
    if (this.isDevelopment) {
      console.log(`[INFO] ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  warn(message: string, data?: unknown, context?: string) {
    const entry = this.createLogEntry('warn', message, data, context);
    this.addLog(entry);
    if (this.isDevelopment) {
      console.warn(`[WARN] ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  error(message: string, error?: unknown, context?: string) {
    const entry = this.createLogEntry('error', message, error, context);
    this.addLog(entry);
    console.error(`[ERROR] ${context ? `[${context}]` : ''} ${message}`, error || '');
  }

  debug(message: string, data?: unknown, context?: string) {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, data, context);
      this.addLog(entry);
      console.debug(`[DEBUG] ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
