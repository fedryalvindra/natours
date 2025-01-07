const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
} = require('./../controllers/tourController');
const { protect, restrictTo } = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// POST /tour/123123/reviews
// GET /tour/123123/reviews
// GET /tour/123123/reviews/98787asd

// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);

// /tours/asdadasdasd/reviews
// we need to make reviewRouter get access to tourId by using (mergeParams)
router.use('/:tourId/reviews', reviewRouter);

// param middleware is middleware that only run for certain parameter
// param('id') which param the middleware function will run
// fourth argument stand for value of the params
// router.param('id', checkID);

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
