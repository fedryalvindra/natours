class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A). Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // delete field of queryObj
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B). Advanced filterig
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // {difficulty: 'easy', duration: { $gte:5}}
    // { difficulty: 'easy', duration: { gte: '5' } }
    // replace gte, gt, lte, lt

    this.query = this.query.find(JSON.parse(queryStr));
    // use mongodb filter obj
    // let query = Tour.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // 2). Sorting
    if (this.queryString.sort) {
      // for second criteria
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // sort('price ratingsAverage')
    } else {
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  limitFields() {
    // 3). Field Limiting: limit data result props
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // - in select is for except the __v
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // 4). Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=2&limit=10, 1 - 10 page 1, 11 - 20 page 2
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   // amount of tours
    //   const numTours = await Tour.countDocuments();
    //   // if data that are skip is greater than data that exist
    //   if (skip >= numTours) throw new Error('This page does not exist');
    // }

    return this;
  }
}

module.exports = APIFeatures;
