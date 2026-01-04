const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' })
  ]
});

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.userId || 'anonymous'
  });
  
  // Development vs production error response
  const isProduction = process.env.NODE_ENV === 'production';
  
  const errorResponse = {
    success: false,
    message: isProduction ? 'Something went wrong' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  };
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    errorResponse.message = 'Validation Error';
    errorResponse.errors = messages;
    return res.status(400).json(errorResponse);
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    errorResponse.message = 'Duplicate field value entered';
    return res.status(400).json(errorResponse);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Invalid token';
    return res.status(401).json(errorResponse);
  }
  
  if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Token expired';
    return res.status(401).json(errorResponse);
  }
  
  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorResponse.message = 'File size too large. Maximum size is 5MB.';
    } else if (err.code === 'LIMIT_FILE_TYPE') {
      errorResponse.message = 'Invalid file type. Only JPEG, PNG, and PDF are allowed.';
    }
    return res.status(400).json(errorResponse);
  }
  
  // Default error
  errorResponse.statusCode = err.statusCode || 500;
  res.status(errorResponse.statusCode).json(errorResponse);
};

module.exports = errorHandler;