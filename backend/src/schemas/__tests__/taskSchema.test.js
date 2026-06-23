const { create, update, listQuery } = require('../taskSchema');

describe('task create schema', () => {
  it('accepts minimal valid input and applies defaults', () => {
    const result = create.safeParse({ title: 'Fix bug' });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('todo');
    expect(result.data.priority).toBe('medium');
  });

  it('accepts full valid input', () => {
    const result = create.safeParse({
      title: 'Fix bug',
      description: 'Details here',
      status: 'in_progress',
      priority: 'high',
      assignee_id: '550e8400-e29b-41d4-a716-446655440000',
      due_date: '2026-12-31T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null assignee_id and due_date', () => {
    const result = create.safeParse({ title: 'Task', assignee_id: null, due_date: null });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = create.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 200 characters', () => {
    const result = create.safeParse({ title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = create.safeParse({ title: 'Task', status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = create.safeParse({ title: 'Task', priority: 'critical' });
    expect(result.success).toBe(false);
  });

  it('rejects non-uuid assignee_id', () => {
    const result = create.safeParse({ title: 'Task', assignee_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed due_date', () => {
    const result = create.safeParse({ title: 'Task', due_date: 'not-a-date' });
    expect(result.success).toBe(false);
  });
});

describe('task update schema', () => {
  it('accepts partial update', () => {
    const result = update.safeParse({ status: 'done' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no-op update)', () => {
    const result = update.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid status in update', () => {
    const result = update.safeParse({ status: 'blocked' });
    expect(result.success).toBe(false);
  });
});

describe('task listQuery schema', () => {
  it('coerces page and limit from strings', () => {
    const result = listQuery.safeParse({ page: '3', limit: '50' });
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(3);
    expect(result.data.limit).toBe(50);
  });

  it('defaults page to 1 and limit to 20', () => {
    const result = listQuery.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
  });

  it('accepts valid status and priority filters', () => {
    const result = listQuery.safeParse({ status: 'in_progress', priority: 'high' });
    expect(result.success).toBe(true);
  });

  it('accepts valid assignee_id filter', () => {
    const result = listQuery.safeParse({ assignee_id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid assignee_id filter', () => {
    const result = listQuery.safeParse({ assignee_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});
