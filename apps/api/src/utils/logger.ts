import pino from 'pino';
import { Config } from '@/config/config';

const logger = pino({
  level: Config.LOG_LEVEL || 'info',
  transport: Config.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

export default logger;
