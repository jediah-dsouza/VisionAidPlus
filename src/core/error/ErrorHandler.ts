import { logger } from '../debug';
import { eventBus } from '../events/EventBus';

export interface ErrorContext {
  componentStack?: string;
  extra?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

export interface ErrorReport {
  id: string;
  name: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

type ErrorHandler = (error: Error, context: ErrorContext) => void;

class GlobalErrorHandler {
  private handlers: ErrorHandler[] = [];
  private errorHistory: ErrorReport[] = [];
  private maxHistorySize = 50;

  registerHandler(handler: ErrorHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) this.handlers.splice(index, 1);
    };
  }

  handleError(error: Error, extra?: Record<string, unknown>): void {
    const context: ErrorContext = {
      componentStack: error.stack,
      extra,
      timestamp: new Date().toISOString(),
    };

    const report: ErrorReport = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      severity: this.determineSeverity(error),
    };

    this.errorHistory.push(report);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    logger.error(`Error caught: ${error.name} - ${error.message}`, error.stack);

    this.handlers.forEach(handler => {
      try {
        handler(error, context);
      } catch (handlerError) {
        logger.error('Error in error handler', handlerError);
      }
    });
  }

  private determineSeverity(error: Error): ErrorReport['severity'] {
    const criticalErrors = ['RangeError', 'ReferenceError', 'TypeError'];
    if (criticalErrors.includes(error.name)) return 'high';
    return 'medium';
  }

  getErrorHistory(): ReadonlyArray<ErrorReport> {
    return this.errorHistory;
  }

  clearHistory(): void {
    this.errorHistory = [];
  }
}

export const errorHandler = new GlobalErrorHandler();

export const withErrorBoundary = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  componentName: string,
): T => {
  return ((...args: unknown[]) => {
    try {
      return fn(...args);
    } catch (error) {
      errorHandler.handleError(error as Error, { component: componentName });
      return null;
    }
  }) as T;
};

global.onerror = (message, source, lineno, colno, error) => {
  errorHandler.handleError(error ?? new Error(String(message)), {
    extra: { source, lineno, colno },
  });
};

global.unhandledrejection = event => {
  errorHandler.handleError(new Error(event.reason?.message ?? 'Unhandled Promise Rejection'), {
    extra: { reason: event.reason },
  });
};
