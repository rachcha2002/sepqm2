// @ts-check
const { test, expect } = require('@playwright/test');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// First, let's install the required dependencies
// Run: npm install sqlite3 sqlite --save-dev

test.describe('Database Testing', () => {
  let db;
  
  test.beforeAll(async () => {
    try {
      // Use in-memory database instead of file-based to avoid locking issues
      db = await open({
        filename: ':memory:', // In-memory SQLite database
        driver: sqlite3.Database
      });
      
      // Create a users table
      await db.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          email TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create a products table
      await db.exec(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          price REAL,
          stock INTEGER
        )
      `);
      
      // Seed some initial test data
      await db.exec(`
        INSERT INTO users (username, email) VALUES 
          ('testuser1', 'test1@example.com'),
          ('testuser2', 'test2@example.com');
          
        INSERT INTO products (name, price, stock) VALUES
          ('Laptop', 999.99, 10),
          ('Smartphone', 499.99, 20),
          ('Headphones', 99.99, 30);
      `);
    } catch (error) {
      console.error('Database setup error:', error);
      throw error;
    }
  });
  
  test.afterAll(async () => {
    try {
      // Close the database connection
      if (db) {
        await db.close();
      }
    } catch (error) {
      console.error('Database teardown error:', error);
    }
  });

  test('Database connection test', async () => {
    // Simple query to check if database connection works
    const result = await db.get('SELECT sqlite_version() as version');
    expect(result).toBeDefined();
    expect(result.version).toBeDefined();
  });

  test('Insert record into database', async () => {
    // Insert a new user
    const result = await db.run(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      ['newuser', 'newuser@example.com']
    );
    
    // Check if insert was successful
    expect(result.lastID).toBeGreaterThan(0);
    
    // Verify record was inserted
    const user = await db.get('SELECT * FROM users WHERE username = ?', ['newuser']);
    expect(user).toBeDefined();
    expect(user.username).toBe('newuser');
    expect(user.email).toBe('newuser@example.com');
  });

  test('Update record in database', async () => {
    // Update a product
    const result = await db.run(
      'UPDATE products SET price = ?, stock = ? WHERE name = ?',
      [1099.99, 5, 'Laptop']
    );
    
    // Check if update was successful
    expect(result.changes).toBe(1);
    
    // Verify record was updated
    const product = await db.get('SELECT * FROM products WHERE name = ?', ['Laptop']);
    expect(product).toBeDefined();
    expect(product.price).toBe(1099.99);
    expect(product.stock).toBe(5);
  });

  test('Delete record from database', async () => {
    // Delete a user
    const result = await db.run(
      'DELETE FROM users WHERE username = ?',
      ['testuser2']
    );
    
    // Check if delete was successful
    expect(result.changes).toBe(1);
    
    // Verify record was deleted
    const user = await db.get('SELECT * FROM users WHERE username = ?', ['testuser2']);
    expect(user).toBeUndefined();
  });

  test('Complex query with JOIN', async () => {
    // First create a new table for orders
    await db.exec(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);
    
    // Add some order data
    await db.exec(`
      INSERT INTO orders (user_id, product_id, quantity) VALUES
        (1, 1, 1),
        (1, 3, 2);
    `);
    
    // Run a JOIN query
    const orders = await db.all(`
      SELECT u.username, p.name as product_name, o.quantity
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      WHERE u.username = 'testuser1'
    `);
    
    // Verify complex query results
    expect(orders).toBeInstanceOf(Array);
    expect(orders.length).toBe(2);
    expect(orders[0].username).toBe('testuser1');
    expect(orders[0].product_name).toBe('Laptop');
    expect(orders[0].quantity).toBe(1);
    expect(orders[1].product_name).toBe('Headphones');
    expect(orders[1].quantity).toBe(2);
  });
}); 