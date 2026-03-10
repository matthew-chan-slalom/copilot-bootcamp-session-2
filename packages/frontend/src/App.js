import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'dueToday', label: 'Due Today' },
  { value: 'dueThisWeek', label: 'Due This Week' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'noDueDate', label: 'No Due Date' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'dueDate', label: 'Due Date' },
];

const ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

const getStatusChipColor = status => {
  if (status === 'overdue') {
    return 'error';
  }

  if (status === 'dueToday') {
    return 'warning';
  }

  if (status === 'completed') {
    return 'success';
  }

  return 'default';
};

const getStatusLabel = status => {
  if (status === 'dueToday') {
    return 'Due Today';
  }
  if (status === 'dueThisWeek') {
    return 'Due This Week';
  }
  if (status === 'overdue') {
    return 'Overdue';
  }
  if (status === 'completed') {
    return 'Completed';
  }
  if (status === 'noDueDate') {
    return 'No Due Date';
  }
  return 'Upcoming';
};

const formatDueDate = dueDate => (dueDate ? dayjs(dueDate).format('MMM D, YYYY') : 'No due date');

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDueDate, setNewItemDueDate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDueDate, setEditDueDate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ filter, sort, order }).toString();
      const response = await fetch(`/api/items?${query}`);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setItems(result);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, sort, order]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateItem = async e => {
    e.preventDefault();
    if (!newItemName.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItemName,
          dueDate: newItemDueDate ? newItemDueDate.format('YYYY-MM-DD') : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      setNewItemName('');
      setNewItemDueDate(null);
      await fetchData();
    } catch (err) {
      setError(`Error adding item: ${err.message}`);
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = async itemId => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setItems(items.filter(item => item.id !== itemId));
      setError(null);
    } catch (err) {
      setError(`Error deleting item: ${err.message}`);
      console.error('Error deleting item:', err);
    }
  };

  const handleToggleCompleted = async item => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !item.completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      await fetchData();
    } catch (err) {
      setError(`Error updating item: ${err.message}`);
    }
  };

  const openEditDialog = item => {
    setEditingItem(item);
    setEditName(item.name);
    setEditDueDate(item.dueDate ? dayjs(item.dueDate) : null);
  };

  const closeEditDialog = () => {
    setEditingItem(null);
    setEditName('');
    setEditDueDate(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          dueDate: editDueDate ? editDueDate.format('YYYY-MM-DD') : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      closeEditDialog();
      await fetchData();
    } catch (err) {
      setError(`Error updating item: ${err.message}`);
    }
  };

  const itemSummary = useMemo(() => {
    const completedCount = items.filter(item => item.completed).length;
    const overdueCount = items.filter(item => item.dueStatus === 'overdue').length;

    return {
      total: items.length,
      completed: completedCount,
      overdue: overdueCount,
    };
  }, [items]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="App">
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" component="h1" gutterBottom>
                  Todo Planner
                </Typography>
                <Typography color="text.secondary">
                  Track tasks with optional due dates, filters, and status indicators.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                  <Chip label={`Total: ${itemSummary.total}`} />
                  <Chip label={`Completed: ${itemSummary.completed}`} color="success" variant="outlined" />
                  <Chip label={`Overdue: ${itemSummary.overdue}`} color="error" variant="outlined" />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Todo
                </Typography>
                <Box component="form" onSubmit={handleCreateItem}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Task name"
                      value={newItemName}
                      onChange={event => setNewItemName(event.target.value)}
                      placeholder="Enter item name"
                      required
                    />
                    <DatePicker
                      label="Due date (optional)"
                      value={newItemDueDate}
                      onChange={value => setNewItemDueDate(value)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <Button variant="contained" type="submit" sx={{ minWidth: 140 }}>
                      Add Item
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="filter-label">Filter</InputLabel>
                    <Select
                      labelId="filter-label"
                      value={filter}
                      label="Filter"
                      onChange={event => setFilter(event.target.value)}
                    >
                      {FILTER_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="sort-label">Sort by</InputLabel>
                    <Select
                      labelId="sort-label"
                      value={sort}
                      label="Sort by"
                      onChange={event => setSort(event.target.value)}
                    >
                      {SORT_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="order-label">Order</InputLabel>
                    <Select
                      labelId="order-label"
                      value={order}
                      label="Order"
                      onChange={event => setOrder(event.target.value)}
                    >
                      {ORDER_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Todo Items
                </Typography>
                {loading && <Typography>Loading data...</Typography>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && items.length === 0 && <Typography>No items found. Add some!</Typography>}
                {!loading && !error && items.length > 0 && (
                  <List>
                    {items.map(item => (
                      <ListItem
                        key={item.id}
                        divider
                        secondaryAction={
                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" onClick={() => openEditDialog(item)}>
                              Edit
                            </Button>
                            <Chip label={getStatusLabel(item.dueStatus)} color={getStatusChipColor(item.dueStatus)} />
                            <Button color="error" variant="outlined" onClick={() => handleDelete(item.id)}>
                              Delete
                            </Button>
                          </Stack>
                        }
                      >
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                          <Checkbox
                            checked={item.completed}
                            onChange={() => handleToggleCompleted(item)}
                            inputProps={{ 'aria-label': `Mark ${item.name} complete` }}
                          />
                          <ListItemText
                            primary={
                              <Typography
                                sx={{ textDecoration: item.completed ? 'line-through' : 'none', fontWeight: 600 }}
                              >
                                {item.name}
                              </Typography>
                            }
                            secondary={`Due: ${formatDueDate(item.dueDate)}`}
                          />
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Container>

        <Dialog open={Boolean(editingItem)} onClose={closeEditDialog} fullWidth maxWidth="sm">
          <DialogTitle>Edit Todo</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Task name"
                value={editName}
                onChange={event => setEditName(event.target.value)}
                fullWidth
                required
              />
              <DatePicker
                label="Due date"
                value={editDueDate}
                onChange={value => setEditDueDate(value)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <Button variant="text" onClick={() => setEditDueDate(null)}>
                Remove Due Date
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Cancel</Button>
            <Button onClick={handleSaveEdit} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
}

export default App;