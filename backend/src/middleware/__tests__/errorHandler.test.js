const { errorHandler, AppError } = require('../errorHandler');
const { ZodError } = require('zod');

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('errorHandler middleware', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('handles ZodError with 422 and maps issues to field/message pairs', () => {
    const err = new ZodError([
      { path: ['email'], message: 'Invalid email', code: 'invalid_string', validation: 'email' },
    ]);
    const res = makeRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('error');
    expect(body.errors[0].field).toBe('email');
    expect(body.errors[0].message).toBe('Invalid email');
  });

  it('handles JsonWebTokenError with 401', () => {
    const err = Object.assign(new Error('invalid signature'), { name: 'JsonWebTokenError' });
    const res = makeRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].status).toBe('error');
  });

  it('handles TokenExpiredError with 401', () => {
    const err = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });
    const res = makeRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('handles pg unique-violation (23505) with 409', () => {
    const err = Object.assign(new Error('duplicate key'), { code: '23505' });
    const res = makeRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('handles pg foreign-key violation (23503) with 422', () => {
    const err = Object.assign(new Error('foreign key violation'), { code: '23503' });
    const res = makeRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('handles AppError with its own status code and message', () => {
    const err = new AppError('Not found', 404);
    const res = makeRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toBe('Not found');
  });

  it('returns 500 with opaque message for unknown errors in production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const err = new Error('internal db connection string leaked');
    const res = makeRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Something went wrong');
    process.env.NODE_ENV = original;
  });

  it('returns 500 and logs the error in non-production', () => {
    process.env.NODE_ENV = 'test';
    const err = new Error('test error');
    const res = makeRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(console.error).toHaveBeenCalledWith(err);
  });
});

describe('AppError', () => {
  it('sets isOperational to true', () => {
    const err = new AppError('Forbidden', 403);
    expect(err.isOperational).toBe(true);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Forbidden');
  });
});
