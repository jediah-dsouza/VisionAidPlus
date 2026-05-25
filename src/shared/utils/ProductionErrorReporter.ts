import { errorHandler, type ErrorReport } from '@core/error/ErrorHandler';
import { logger } from '@core/debug';

type ErrorTransport = (report: ErrorReport) => void;

class ProductionErrorReporter {
  private transports: ErrorTransport[] = [];
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    errorHandler.registerHandler((_error, _context) => {
      const history = errorHandler.getErrorHistory();
      const report = history[history.length - 1];
      if (report) {
        this.dispatchToTransports(report);
      }
    });

    logger.info('[ErrorReporter] Registered error handler transport');
  }

  addTransport(transport: ErrorTransport): () => void {
    this.transports.push(transport);
    return () => {
      const index = this.transports.indexOf(transport);
      if (index > -1) this.transports.splice(index, 1);
    };
  }

  private dispatchToTransports(report: ErrorReport): void {
    for (const transport of this.transports) {
      try {
        transport(report);
      } catch (error) {
        logger.error('[ErrorReporter] Transport error:', error);
      }
    }
  }

  destroy(): void {
    this.transports = [];
    this.initialized = false;
  }
}

export const productionErrorReporter = new ProductionErrorReporter();
