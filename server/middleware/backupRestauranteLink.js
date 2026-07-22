module.exports = function backupRestauranteLinkMiddleware() {
  return function(req, res, next) {
    return next();
  };
};
