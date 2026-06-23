import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Record<string, any>, res: Record<string, any>, next: () => void) {
    const method = req.method;
    const httpUrl = req.url || req.originalUrl;
    const userAgent = req.headers?.['user-agent'] || '';

    const onFinish = () => {
      const statusCode = res.statusCode || '-';
      const contentLength = res.getHeader?.('content-length') || '-';

      this.logger.log(
        `${method} ${httpUrl} ${statusCode} ${contentLength} - ${userAgent}`,
      );
    };

    res.on?.('finish', onFinish);

    next();
  }
}
