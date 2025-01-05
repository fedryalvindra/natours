const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

// describing schema
// props obj is schema type options
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal than 40 characters'],
      minLength: [10, 'A tour name must have more or equal than 10 characters'],
      validate: {
        validator: function (value) {
          return validator.isAlpha(value, 'en-US', { ignore: ' ' });
        },
        message: 'Tour name must only contain characters',
      },
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // "this" not work in update, but only points to current doc on NEW document creation
          return val < this.price; // 100 < 200
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
      // for hiding
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON to specify geospatial data
      // Geospatial requites 2 fields = type and coordinates
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // expect arr of number
      coordinates: [Number],
      address: String,
      description: String,
    },
    // Embedded document of locations
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        // expect the type of each element in guides array to be MONGODB id
        type: mongoose.Schema.ObjectId,
        // references to User collection
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// CREATE PRICE INDEXES: for read performance
// tourSchema.index({ price: 1 });

// Create compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// virtual props cant be querying, because this props its not part of DB
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate to get reviews data in certain tour
tourSchema.virtual('reviews', {
  // references collection
  ref: 'Review',
  // field in foreign field at review
  foreignField: 'tour',
  // _id current field that connect foreignField
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() except .insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// EMBEDDED TOUR GUIDE
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   // override with array of user document
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document..');
//   next();
// });

// // doc is the document that saved
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE: 'this' now is query obj
// tourSchema.pre('find', function (next) {
// all string start with find
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true,
    },
  });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // (this) point to current query
  // populate is for getting the references data. (Ex, references user)
  this.populate({
    path: 'guides',
    // dont show __v and passwordChangedAt
    select: '-__v -passwordChangedAt',
  });

  next();
});

// docs that return from query (start with find)
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} millisecond`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // insert start of the arr
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
