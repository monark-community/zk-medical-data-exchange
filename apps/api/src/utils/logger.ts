import pino from 'pino';
import { Config } from '@/config/config';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file path with date
const logFileName = `api-${new Date().toISOString().split('T')[0]}.log`;
const logFilePath = path.join(logsDir, logFileName);

const logger = pino({
  level: Config.LOG_LEVEL || 'info',
  transport: Config.NODE_ENV === 'development' ? {
    targets: [
      {
        // Pretty console output for development
        target: 'pino-pretty',
        level: Config.LOG_LEVEL || 'info',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
      {
        // File output (JSON format for easier parsing)
        target: 'pino/file',
        level: 'debug', // Log everything to file
        options: {
          destination: logFilePath,
          mkdir: true,
        },
      },
    ],
  } : {
    // Production: log to file only
    target: 'pino/file',
    options: {
      destination: logFilePath,
      mkdir: true,
    },
  },
});

logger.info({ logFile: logFilePath }, 'Logger initialized with file output');

export default logger;
