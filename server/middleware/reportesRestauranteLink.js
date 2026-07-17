module.exports = function reportesRestauranteLinkMiddleware() {
  return function(req, res, next) {
    return next();
  };
};
