import 'reflect-metadata'; // this shim is required
import { useExpressServer, Action } from 'routing-controllers';
import express from 'express';
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, prettyPrint, simple } = format;
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import jwt = require('jsonwebtoken');

// Controllers
import { IndexController, LoginController } from './controller';

// Express Server
const loglevel = process.env.LOGLEVEL || 'info';
const port = process.env.PORT || 1337;
const jwtKey = process.env.JWTKEY || 'complexKey';
const logDir = process.env.LOGDIR || './log';
const app = express();

// Setup for Production Environment
if (process.env.ENV !== 'development') {
  app.set('trust proxy', true);
  app.use(helmet());
  app.disabled('x-powered-by');
}

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

// Logging
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

// Start Server using useExpressServer

useExpressServer(app, {
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
