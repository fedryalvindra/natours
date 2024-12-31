// catch error
module.exports = (fn) => {
  return (req, res, next) => {
    // because is async we can catch for rejected
    fn(req, res, next).catch((err) => next(err));
  };
};
