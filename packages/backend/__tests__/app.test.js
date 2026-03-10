const request = require('supertest');
const { app, db } = require('../src/app');

const seedItems = () => {
  const insert = db.prepare('INSERT INTO items (name, due_date, completed) VALUES (?, ?, ?)');
  insert.run('Seed Item 1', null, 0);
  insert.run('Seed Item 2', '2099-01-15', 0);
};

beforeEach(() => {
  db.prepare('DELETE FROM items').run();
  seedItems();
});

// Test helpers
const createItem = async (name = 'Temp Item to Delete', dueDate = null) => {
  const response = await request(app)
    .post('/api/items')
    .send({ name, dueDate })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('dueDate');
      expect(item).toHaveProperty('completed');
      expect(item).toHaveProperty('dueStatus');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should create a new item with due date', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Has Due Date', dueDate: '2099-02-01' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBe('2099-02-01');
    });

    it('should return 400 for invalid due date', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Invalid Due', dueDate: 'bad-date' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update due date and completion state', async () => {
      const created = await createItem('Needs Update');

      const response = await request(app)
        .put(`/api/items/${created.id}`)
        .send({ dueDate: '2099-04-10', completed: true })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBe('2099-04-10');
      expect(response.body.completed).toBe(true);
      expect(response.body.dueStatus).toBe('completed');
    });

    it('should remove due date when null is provided', async () => {
      const created = await createItem('Remove Due Date', '2099-04-10');

      const response = await request(app)
        .put(`/api/items/${created.id}`)
        .send({ dueDate: null })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();
      expect(response.body.dueStatus).toBe('noDueDate');
    });
  });
});