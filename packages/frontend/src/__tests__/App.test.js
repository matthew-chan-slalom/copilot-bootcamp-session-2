import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const today = new Date().toISOString().slice(0, 10);
let mockItems = [];

const resetMockItems = () => {
  mockItems = [
    {
      id: 1,
      name: 'Test Item 1',
      dueDate: null,
      completed: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      dueStatus: 'noDueDate',
    },
    {
      id: 2,
      name: 'Test Item 2',
      dueDate: today,
      completed: false,
      createdAt: '2023-01-02T00:00:00.000Z',
      dueStatus: 'dueToday',
    },
  ];
};

const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockItems));
  }),
  rest.post('/api/items', async (req, res, ctx) => {
    const { name, dueDate } = req.body;
    if (!name || !name.trim()) {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }

    const newItem = {
      id: mockItems.length + 1,
      name,
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
      dueStatus: dueDate ? 'upcoming' : 'noDueDate',
    };
    mockItems = [...mockItems, newItem];
    return res(ctx.status(201), ctx.json(newItem));
  }),
  rest.put('/api/items/:id', async (req, res, ctx) => {
    const id = Number(req.params.id);
    const updates = req.body;
    mockItems = mockItems.map(item => {
      if (item.id !== id) {
        return item;
      }

      const nextCompleted = updates.completed !== undefined ? updates.completed : item.completed;
      const nextDueDate = updates.dueDate !== undefined ? updates.dueDate : item.dueDate;

      return {
        ...item,
        ...updates,
        completed: nextCompleted,
        dueDate: nextDueDate,
        dueStatus: nextCompleted ? 'completed' : item.dueStatus,
      };
    });

    const updated = mockItems.find(item => item.id === id);
    return res(ctx.status(200), ctx.json(updated));
  }),
  rest.delete('/api/items/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    mockItems = mockItems.filter(item => item.id !== id);
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully', id }));
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  resetMockItems();
});
afterAll(() => server.close());
beforeEach(() => resetMockItems());

describe('App Component', () => {
  test('renders the header', async () => {
    render(<App />);
    expect(screen.getByText('Todo Planner')).toBeInTheDocument();
    expect(
      screen.getByText('Track tasks with optional due dates, filters, and status indicators.')
    ).toBeInTheDocument();
  });

  test('loads and displays items', async () => {
    render(<App />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });

  test('adds a new item', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Enter item name');
    await user.type(input, 'New Test Item');

    const submitButton = screen.getByText('Add Item');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('New Test Item')).toBeInTheDocument();
    });
  });

  test('toggles item completion', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const toggle = screen.getByLabelText('Mark Test Item 1 complete');
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Completed: 1')).toBeInTheDocument();
    });
  });

  test('deletes an item', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no items', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No items found. Add some!')).toBeInTheDocument();
    });
  });
});