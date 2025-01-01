const express = require('express');
const {
  getAllReviews,
  createReview,
  deleteReview,
} = require('./../controllers/reviewController');
const { protect, restrictTo } = require('./../controllers/authController');

// POST /tour/123123/reviews
// GET /tour/123123/reviews
// POST /reviews

// define mergeParams in express.Router()
// by default each route only get access to the parameters of their specific routes
const router = express.Router({
  mergeParams: true,
});

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), createReview);

router.route('/:id').delete(deleteReview);

module.exports = router;
