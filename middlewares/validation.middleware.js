const ApiError = require("../utils/ApiError");

const validate = (requestSchema) => {
  return (req, res, next) => {
    try {
      const { error } = requestSchema.validate(req.body)
      if (error) {
        throw new ApiError(400, error.details[0].message)
      }
      next();
    } catch (error) {
      next(error)
    }
  }
}

module.exports = { validate };
