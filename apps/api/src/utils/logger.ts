/**
 * Logger Configuration
 * 
 * Logs are written to timestamped files in the logs/ directory.
 * File naming format: YYYY-MM-DD_HH-MM-SS.log
 * 
 * In development mode:
 * - Logs are written to both file and console (with pretty formatting)
 * 
 * In production mode:
 * - Logs are written to both file and stdout (JSON format)
 * 
 * All log files are stored in: apps/api/logs/
 */

import pino from 'pino';
import { Config } from '@/config/config';
import { mkdirSync } from 'fs';
import { join } from 'path';

// Create logs directory if it doesn't exist
const logsDir = join(process.cwd(), 'logs');
try {
  mkdirSync(logsDir, { recursive: true });
} catch (error) {
  // Directory already exists or creation failed (will be caught later)
}

// Generate timestamp-based filename (YYYY-MM-DD_HH-MM-SS)
const now = new Date();
const timestamp = now.toISOString()
  .replace(/T/, '_')
  .replace(/:/g, '-')
  .replace(/\..+/, ''); // Remove milliseconds and timezone
const logFilename = `${timestamp}.log`;
const logFilePath = join(logsDir, logFilename);

const logger = pino({
  level: Config.LOG_LEVEL || 'info',
  transport: {
    targets: [
      // File transport - all logs go to timestamped file
      {
        target: 'pino/file',
        level: 'trace',
        options: {
          destination: logFilePath,
          mkdir: true,
        },
      },
      // Console transport for development
      ...(Config.NODE_ENV === 'development' ? [{
        target: 'pino-pretty',
        level: Config.LOG_LEVEL || 'info',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }] : [{
        target: 'pino/file',
        level: Config.LOG_LEVEL || 'info',
        options: {
          destination: 1, // stdout
        },
      }]),
    ],
  },
});

// Log the location of the log file
logger.info({ logFile: logFilePath }, 'Logger initialized - writing to file');

export default logger;
