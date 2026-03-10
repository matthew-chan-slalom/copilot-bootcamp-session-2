const request = require('supertest');
const { app, db } = require('../../src/app');

const insert = db.prepare('INSERT INTO items (name, due_date, completed) VALUES (?, ?, ?)');

beforeEach(() => {
  db.prepare('DELETE FROM items').run();
  insert.run('No Due Date', null, 0);
  insert.run('Due Today', new Date().toISOString().slice(0, 10), 0);
  insert.run('Far Future', '2099-12-31', 0);
  insert.run('Completed Past', '2000-01-01', 1);
});

describe('Todo API Integration', () => {
  it('filters overdue items correctly and excludes completed tasks', async () => {
    const response = await request(app).get('/api/items?filter=overdue');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.every(item => item.dueStatus === 'overdue')).toBe(true);
    expect(response.body.some(item => item.name === 'Completed Past')).toBe(false);
  });

  it('filters no-due-date items', async () => {
    const response = await request(app).get('/api/items?filter=noDueDate');

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('No Due Date');
    expect(response.body[0].dueDate).toBeNull();
  });

  it('sorts by due date ascending with null due dates last', async () => {
    const response = await request(app).get('/api/items?sort=dueDate&order=asc');

    expect(response.status).toBe(200);
    expect(response.body[0].name).toBe('Completed Past');
    expect(response.body[response.body.length - 1].name).toBe('No Due Date');
  });
});
