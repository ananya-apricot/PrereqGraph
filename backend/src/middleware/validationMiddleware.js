const mongoose = require('mongoose');
const HttpError = require('../utils/httpError');

// validate(zodSchema) checks req.body (or another part of the request) and replaces it with the parsed value.
const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.') || source}: ${i.message}`).join('; ');
    return next(new HttpError(400, message));
  }
  req[source] = parsed.data;
  next();
};

// validateIds('id', 'conceptId') rejects malformed ObjectIds in route params with a 400.
const validateIds = (...names) => (req, res, next) => {
  for (const n of names) {
    if (!mongoose.isValidObjectId(req.params[n])) return next(new HttpError(400, `Invalid ${n}`));
  }
  next();
};

module.exports = { validate, validateIds };
