const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// use pug engine
app.set('view engine', 'pug');
// set view for pug
app.set('views', path.join(__dirname, 'views'));

// 1). GLOBAL MIDDLEWARES

// express.static = to serve static file like (HTML, CSS, JS)
// public become root
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// helmet is standard in express development to set header security
// best to use helmet package in the early middleware stack so the headers are sure to be set
app.use(helmet());

// Development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// create limit for IP request
// max = 100 request, windowMs = for ex 100 req in 1 hour:
// limiter is middleware function
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

// effect limiter to only that start with /api
app.use('/api', limiter);

// express.json = middleware for body parser
// get req.body
// limitting amount of data in req body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS = clean user input from malicious html input
app.use(xss());

// Preventing parameter polution
app.use(
  hpp({
    // allow duplicates in the query string
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// make middleware function (apply on every single request)
// if we didnt call next function req&res cycle will be stuck
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3). Routes
// rendering base page
app.get('/', (req, res) => {
  res.status(200).render('base', {
    // pass data to pug template
    tour: 'The Forest Hiker',
    user: 'Fedry'
  })
})

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // whenever we pass anything to next = error
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// global middleware err handling (4 args then express recognize it as err handling middleware)
app.use(globalErrorHandler);

module.exports = app;
