// PROBLEM -2- resolving -- make our App clear data Cache automated with middleware
const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  await next(); // run clear Cache after create new blog post success!

  clearHash(req.user.id);
};
