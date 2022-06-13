const jwt = require("jsonwebtoken");

module.exports = (request, response, next) => {
  const authHeader = request.get('Authorization');
  request.isAuth = false;

  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "secret");
  } catch (error) {
    return next();
  }

  if (!decodedToken) {
    return next();
  }

  request.isAuth = true;
  request.userId = decodedToken.userId;
  next();
};
