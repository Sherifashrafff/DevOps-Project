const { register, login } = require('../authSchema');

describe('register schema', () => {
  it('accepts valid input', () => {
    const result = register.safeParse({ email: 'user@example.com', password: 'password123', full_name: 'Alice' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = register.safeParse({ email: 'not-an-email', password: 'password123', full_name: 'Alice' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('email');
  });

  it('rejects password shorter than 8 characters', () => {
    const result = register.safeParse({ email: 'user@example.com', password: 'abc', full_name: 'Alice' });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('password');
  });

  it('rejects empty full_name', () => {
    const result = register.safeParse({ email: 'user@example.com', password: 'password123', full_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = register.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error.issues.length).toBeGreaterThan(0);
  });
});

describe('login schema', () => {
  it('accepts valid input', () => {
    const result = login.safeParse({ email: 'user@example.com', password: 'any' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = login.safeParse({ email: 'bad', password: 'any' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = login.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = login.safeParse({});
    expect(result.success).toBe(false);
  });
});
