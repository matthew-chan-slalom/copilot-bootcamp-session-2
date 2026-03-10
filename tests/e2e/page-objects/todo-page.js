class TodoPage {
  constructor(page) {
    this.page = page;
    this.taskNameInput = page.getByLabel('Task name');
    this.addItemButton = page.getByRole('button', { name: 'Add Item' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async addItem(name) {
    await this.taskNameInput.fill(name);
    await this.addItemButton.click();
  }

  itemRow(name) {
    return this.page.locator('li').filter({ hasText: name });
  }

  async openEditFor(name) {
    const row = this.itemRow(name);
    await row.getByRole('button', { name: 'Edit' }).click();
  }

  async saveEdit(newName) {
    await this.page.getByRole('dialog').getByLabel('Task name').fill(newName);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async markComplete(name) {
    const row = this.itemRow(name);
    await row.getByRole('checkbox').click();
  }

  async deleteItem(name) {
    const row = this.itemRow(name);
    await row.getByRole('button', { name: 'Delete' }).click();
  }
}

module.exports = { TodoPage };
