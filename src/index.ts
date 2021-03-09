import 'reflect-metadata'; // this shim is required
import { createExpressServer, Action } from 'routing-controllers';
const { createLogger, format, transports } = require('winston');
import jwt = require('jsonwebtoken');

// Project Imports
import { IndexController, LoginController } from './controller';
import { HelmetMiddleware } from './middleware';


// Express Server Setup
const loglevel = process.env.LOGLEVEL || 'info';
const port = process.env.PORT || 3000;
const jwtKey = process.env.JWTKEY || 'complexKey';
const logDir = process.env.LOGDIR || './log';
const environment = process.env.ENV || 'development'
const useProd = environment === 'production' ? true : false;

// Logging Setup
const logger = createLogger({
  level: process.env.LOGLEVEL,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.simple()
  ),
  transports: [
    new transports.Console({
      level: loglevel,
      handleExceptions: true,
      json: false,
      colorize: true
    }),
    new transports.File({
      level: loglevel,
      filename: `${logDir}/server.log`,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false
    }),
    new transports.File({
      level: 'error',
      filename: `${logDir}/error.log`,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false
    })
  ]
});
logger.stream = {
  write: (message: any, encoding: any) => {
    logger.log({
      level: 'info',
      message: message
    });
  }
};





const app = createExpressServer({
  cors: useProd,
  development: useProd,
  errorOverridingMap: {
    ForbiddenError: {
      message: 'Access is denied'
    }
  },
  authorizationChecker: async (action: Action) => {
    const token = action.request.headers['authorization'];
    let check: boolean;
    jwt.verify(token, jwtKey, (error: any, sucess: any) => {
      if (error) {
        check = false;
      } else {
        check = true;
      }
    });
    return check;
  },
  currentUserChecker: async (action: Action) => {
    const token = action.request.headers['authorization'];
    const check = confirmUser(token);
    return check;
  },

  middlewares: [HelmetMiddleware],
  controllers: [IndexController, LoginController]
});

app.listen(port, () => {
  logger.log({
    level: 'info',
    message: `SERVER: Server running on: ${port}`
  });
});

async function confirmUser(token: any) {
  return await new Promise((ok, fail) => {
    jwt.verify(token, jwtKey, (error: any, success: any) => {
      if (error) {
        fail({ user: null, currentuser: false });
      } else {
        ok({ user: success.data.username, currentuser: true });
      }
    });
  });

}
