const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Initialize express app
const app = express();

const APP_TIMEZONE = 'UTC';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize persistent SQLite database
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'todos.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    due_date TEXT,
    completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Backward-compatible migration for existing databases
try {
  db.exec('ALTER TABLE items ADD COLUMN due_date TEXT');
} catch (error) {
  // ignore when column already exists
}

try {
  db.exec('ALTER TABLE items ADD COLUMN completed INTEGER DEFAULT 0');
} catch (error) {
  // ignore when column already exists
}

// Insert some initial data
const initialItems = ['Item 1', 'Item 2', 'Item 3'];
const insertStmt = db.prepare('INSERT INTO items (name, due_date, completed) VALUES (?, ?, ?)');

const itemCount = db.prepare('SELECT COUNT(*) AS count FROM items').get();
if (itemCount.count === 0) {
  initialItems.forEach(item => {
    insertStmt.run(item, null, 0);
  });
}

console.log(`SQLite database initialized at ${dbPath}`);

const isValidIsoDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const getUtcDateOnly = date => date.toISOString().slice(0, 10);

const getCurrentUtcDate = () => getUtcDateOnly(new Date());

const getWeekRangeUtc = () => {
  const now = new Date();
  const midnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = midnightUtc.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const start = new Date(midnightUtc);
  start.setUTCDate(start.getUTCDate() + mondayOffset);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    start: getUtcDateOnly(start),
    end: getUtcDateOnly(end),
  };
};

const getDueStatus = item => {
  if (!item.due_date) {
    return 'noDueDate';
  }

  if (item.completed) {
    return 'completed';
  }

  const today = getCurrentUtcDate();
  if (item.due_date < today) {
    return 'overdue';
  }

  if (item.due_date === today) {
    return 'dueToday';
  }

  const { start, end } = getWeekRangeUtc();
  if (item.due_date >= start && item.due_date <= end) {
    return 'dueThisWeek';
  }

  return 'upcoming';
};

const serializeItem = item => ({
  id: item.id,
  name: item.name,
  dueDate: item.due_date,
  completed: Boolean(item.completed),
  createdAt: item.created_at,
  dueStatus: getDueStatus(item),
  timezone: APP_TIMEZONE,
});

const applyFilter = (items, filter) => {
  if (!filter || filter === 'all') {
    return items;
  }

  const today = getCurrentUtcDate();
  const { start, end } = getWeekRangeUtc();

  if (filter === 'dueToday') {
    return items.filter(item => item.due_date === today && !item.completed);
  }

  if (filter === 'dueThisWeek') {
    return items.filter(
      item => item.due_date && item.due_date >= start && item.due_date <= end && !item.completed
    );
  }

  if (filter === 'overdue') {
    return items.filter(item => item.due_date && item.due_date < today && !item.completed);
  }

  if (filter === 'noDueDate') {
    return items.filter(item => !item.due_date);
  }

  return items;
};

const applySort = (items, sort, order) => {
  const direction = order === 'desc' ? -1 : 1;

  if (sort === 'dueDate') {
    return [...items].sort((a, b) => {
      if (!a.due_date && !b.due_date) {
        return 0;
      }
      if (!a.due_date) {
        return 1;
      }
      if (!b.due_date) {
        return -1;
      }
      if (a.due_date < b.due_date) {
        return -1 * direction;
      }
      if (a.due_date > b.due_date) {
        return 1 * direction;
      }
      return 0;
    });
  }

  return [...items].sort((a, b) => {
    if (a.created_at < b.created_at) {
      return -1 * direction;
    }
    if (a.created_at > b.created_at) {
      return 1 * direction;
    }
    return 0;
  });
};

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running', timezone: APP_TIMEZONE });
});

// API Routes
app.get('/api/items', (req, res) => {
  try {
    const { filter = 'all', sort = 'createdAt', order = 'desc' } = req.query;
    const rows = db.prepare('SELECT * FROM items').all();
    const filteredItems = applyFilter(rows, filter);
    const sortedItems = applySort(filteredItems, sort, order);
    res.json(sortedItems.map(serializeItem));
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name, dueDate } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    if (dueDate != null && dueDate !== '' && !isValidIsoDate(dueDate)) {
      return res.status(400).json({ error: 'Due date must be a valid date in YYYY-MM-DD format' });
    }

    const normalizedDueDate = dueDate ? dueDate : null;
    const result = insertStmt.run(name.trim(), normalizedDueDate, 0);
    const id = result.lastInsertRowid;

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.status(201).json(serializeItem(newItem));
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, dueDate, completed } = req.body;

    if (!id || Number.isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Item name must be a non-empty string' });
    }

    if (dueDate !== undefined && dueDate !== null && dueDate !== '' && !isValidIsoDate(dueDate)) {
      return res.status(400).json({ error: 'Due date must be a valid date in YYYY-MM-DD format' });
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed must be a boolean value' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const nextName = name !== undefined ? name.trim() : existingItem.name;
    let nextDueDate = existingItem.due_date;
    if (dueDate === null || dueDate === '') {
      nextDueDate = null;
    } else if (dueDate !== undefined) {
      nextDueDate = dueDate;
    }

    const nextCompleted = completed !== undefined ? (completed ? 1 : 0) : existingItem.completed;

    db.prepare('UPDATE items SET name = ?, due_date = ?, completed = ? WHERE id = ?').run(
      nextName,
      nextDueDate,
      nextCompleted,
      id
    );

    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(serializeItem(updatedItem));
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || Number.isNaN(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = { app, db, insertStmt };