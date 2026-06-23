const { create, update, addMember, listQuery } = require('../projectSchema');

describe('project create schema', () => {
  it('accepts minimal valid input and defaults status to active', () => {
    const result = create.safeParse({ name: 'My Project' });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('active');
  });

  it('accepts full valid input', () => {
    const result = create.safeParse({ name: 'My Project', description: 'desc', status: 'archived' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = create.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 120 characters', () => {
    const result = create.safeParse({ name: 'a'.repeat(121) });
    expect(result.success).toBe(false);
  });

  it('rejects description exceeding 2000 characters', () => {
    const result = create.safeParse({ name: 'Project', description: 'x'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status value', () => {
    const result = create.safeParse({ name: 'Project', status: 'deleted' });
    expect(result.success).toBe(false);
  });
});

describe('project update schema', () => {
  it('accepts partial update', () => {
    const result = update.safeParse({ name: 'Renamed' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no-op update)', () => {
    const result = update.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = update.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('project addMember schema', () => {
  it('accepts valid uuid and defaults role to member', () => {
    const result = addMember.safeParse({ user_id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
    expect(result.data.role).toBe('member');
  });

  it('accepts owner role', () => {
    const result = addMember.safeParse({ user_id: '550e8400-e29b-41d4-a716-446655440000', role: 'owner' });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid user_id', () => {
    const result = addMember.safeParse({ user_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = addMember.safeParse({ user_id: '550e8400-e29b-41d4-a716-446655440000', role: 'admin' });
    expect(result.success).toBe(false);
  });
});

describe('project listQuery schema', () => {
  it('coerces page and limit from strings', () => {
    const result = listQuery.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(2);
    expect(result.data.limit).toBe(10);
  });

  it('defaults page to 1 and limit to 20', () => {
    const result = listQuery.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
  });

  it('rejects limit over 100', () => {
    const result = listQuery.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });

  it('rejects page below 1', () => {
    const result = listQuery.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('filters by valid status', () => {
    const result = listQuery.safeParse({ status: 'archived' });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('archived');
  });
});
