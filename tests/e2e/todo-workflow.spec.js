const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./page-objects/todo-page');

test.describe('Todo workflow', () => {
  test.beforeEach(async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await expect(page.getByText('Todo Planner')).toBeVisible();
  });

  test('can create, edit, complete, and delete an item', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const initialName = `E2E Item ${Date.now()}`;
    const updatedName = `${initialName} Updated`;

    await todoPage.addItem(initialName);
    await expect(todoPage.itemRow(initialName)).toBeVisible();

    await todoPage.openEditFor(initialName);
    await todoPage.saveEdit(updatedName);
    await expect(todoPage.itemRow(updatedName)).toBeVisible();

    await todoPage.markComplete(updatedName);
    await expect(todoPage.itemRow(updatedName).getByRole('checkbox')).toBeChecked();

    await todoPage.deleteItem(updatedName);
    await expect(todoPage.itemRow(updatedName)).toHaveCount(0);
  });
});
