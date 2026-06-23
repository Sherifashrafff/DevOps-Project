const { validate, validateQuery } = require('../validate');
const { z } = require('zod');

const schema = z.object({ name: z.string().min(1) });

describe('validate middleware', () => {
  it('calls next() with no args and replaces req.body with parsed value on valid input', () => {
    const req = { body: { name: 'Alice' } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Alice' });
  });

  it('strips unknown fields from req.body', () => {
    const req = { body: { name: 'Alice', extra: 'stripped' } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).not.toHaveProperty('extra');
  });

  it('calls next() with ZodError when a field fails validation', () => {
    const req = { body: { name: '' } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    const [err] = next.mock.calls[0];
    expect(err.name).toBe('ZodError');
  });

  it('calls next() with ZodError when required field is missing', () => {
    const req = { body: {} };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    const [err] = next.mock.calls[0];
    expect(err.name).toBe('ZodError');
    expect(err.issues[0].path).toContain('name');
  });
});

describe('validateQuery middleware', () => {
  it('calls next() with no args and replaces req.query on valid input', () => {
    const req = { query: { name: 'project' } };
    const next = jest.fn();
    validateQuery(schema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.query).toEqual({ name: 'project' });
  });

  it('calls next() with ZodError on invalid query', () => {
    const req = { query: { name: '' } };
    const next = jest.fn();
    validateQuery(schema)(req, {}, next);
    const [err] = next.mock.calls[0];
    expect(err.name).toBe('ZodError');
  });
});
