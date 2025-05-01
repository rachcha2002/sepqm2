// @ts-check
const { test, expect } = require("@playwright/test");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const fs = require("fs");

/**
 * Database Testing Suite
 * Tests database operations using SQLite
 * Includes valid and invalid database operations
 */
test.describe("Database Testing", () => {
  let db;

  // Create logs directory if it doesn't exist
  if (!fs.existsSync("./test-results/db-logs")) {
    fs.mkdirSync("./test-results/db-logs", { recursive: true });
  }

  test.beforeAll(async () => {
    console.log("Setting up test database...");
    try {
      // Use in-memory database instead of file-based to avoid locking issues
      db = await open({
        filename: ":memory:", // In-memory SQLite database
        driver: sqlite3.Database,
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

      console.log("Database setup complete");

      // Log initial database state
      const users = await db.all("SELECT * FROM users");
      const products = await db.all("SELECT * FROM products");

      fs.writeFileSync(
        "./test-results/db-logs/initial-users.json",
        JSON.stringify(users, null, 2)
      );
      fs.writeFileSync(
        "./test-results/db-logs/initial-products.json",
        JSON.stringify(products, null, 2)
      );
    } catch (error) {
      console.error("Database setup error:", error);
      throw error;
    }
  });

  test.afterAll(async () => {
    try {
      // Log final database state
      const users = await db.all("SELECT * FROM users");
      const products = await db.all("SELECT * FROM products");

      fs.writeFileSync(
        "./test-results/db-logs/final-users.json",
        JSON.stringify(users, null, 2)
      );
      fs.writeFileSync(
        "./test-results/db-logs/final-products.json",
        JSON.stringify(products, null, 2)
      );

      // Close the database connection
      if (db) {
        await db.close();
        console.log("Database connection closed");
      }
    } catch (error) {
      console.error("Database teardown error:", error);
    }
  });

  /**
   * VALID TEST CASE: Database Connection
   * Test ID: DB-001
   * Description: Tests establishing a connection to the database
   * Expected Result: Connection is successful and version info is returned
   */
  test("VALID: Database connection test", async () => {
    console.log("Testing database connection...");

    // Simple query to check if database connection works
    const result = await db.get("SELECT sqlite_version() as version");

    // Log results
    console.log(`SQLite Version: ${result.version}`);
    fs.writeFileSync(
      "./test-results/db-logs/db-version.json",
      JSON.stringify(result, null, 2)
    );

    expect(result).toBeDefined();
    expect(result.version).toBeDefined();
    console.log("Database connection successful");
  });

  /**
   * VALID TEST CASE: Insert Record
   * Test ID: DB-002
   * Description: Tests inserting a new record into the database
   * Expected Result: Record is successfully inserted
   */
  test("VALID: Insert record into database", async () => {
    console.log("Testing insert operation...");

    // Prepare test data
    const newUser = {
      username: "newuser",
      email: "newuser@example.com",
    };

    // Log insertion data
    console.log("Inserting user:", newUser);
    fs.writeFileSync(
      "./test-results/db-logs/insert-user-data.json",
      JSON.stringify(newUser, null, 2)
    );

    // Insert a new user
    const result = await db.run(
      "INSERT INTO users (username, email) VALUES (?, ?)",
      [newUser.username, newUser.email]
    );

    // Log result
    console.log(
      `Insert result - lastID: ${result.lastID}, changes: ${result.changes}`
    );
    fs.writeFileSync(
      "./test-results/db-logs/insert-result.json",
      JSON.stringify(
        {
          lastID: result.lastID,
          changes: result.changes,
        },
        null,
        2
      )
    );

    // Check if insert was successful
    expect(result.lastID).toBeGreaterThan(0);
    expect(result.changes).toBe(1);

    // Verify record was inserted
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      newUser.username,
    ]);

    // Log retrieved user
    console.log("Retrieved user after insert:", user);
    fs.writeFileSync(
      "./test-results/db-logs/inserted-user.json",
      JSON.stringify(user, null, 2)
    );

    expect(user).toBeDefined();
    expect(user.username).toBe(newUser.username);
    expect(user.email).toBe(newUser.email);
    console.log("User inserted successfully");
  });

  /**
   * INVALID TEST CASE: Insert Duplicate Record
   * Test ID: DB-003
   * Description: Tests inserting a duplicate record with unique constraint
   * Expected Result: Insert fails with constraint violation
   */
  test("INVALID: Insert duplicate record with unique constraint", async () => {
    console.log("Testing insert with unique constraint violation...");

    // Prepare duplicate user data (username is unique)
    const duplicateUser = {
      username: "testuser1", // Already exists in database
      email: "duplicate@example.com",
    };

    // Log insertion attempt data
    console.log("Attempting to insert duplicate user:", duplicateUser);
    fs.writeFileSync(
      "./test-results/db-logs/duplicate-user-data.json",
      JSON.stringify(duplicateUser, null, 2)
    );

    try {
      // Attempt to insert duplicate user
      await db.run("INSERT INTO users (username, email) VALUES (?, ?)", [
        duplicateUser.username,
        duplicateUser.email,
      ]);

      // If we get here, the test should fail because an exception should have been thrown
      console.log("UNEXPECTED: Insert succeeded when it should have failed");
      expect(false).toBe(true); // Force test to fail
    } catch (error) {
      // Log the error
      console.log("Expected error occurred:", error.message);
      fs.writeFileSync(
        "./test-results/db-logs/duplicate-insert-error.json",
        JSON.stringify(
          {
            message: error.message,
          },
          null,
          2
        )
      );

      // Verify error is related to unique constraint
      expect(error.message).toContain("UNIQUE constraint failed");
      console.log(
        "Unique constraint violation correctly prevented duplicate insertion"
      );
    }
  });

  /**
   * VALID TEST CASE: Update Record
   * Test ID: DB-004
   * Description: Tests updating an existing record
   * Expected Result: Record is successfully updated
   */
  test("VALID: Update record in database", async () => {
    console.log("Testing update operation...");

    // Prepare test data
    const productToUpdate = "Laptop";
    const newPrice = 1099.99;
    const newStock = 5;

    // Log update data
    console.log(
      `Updating product: ${productToUpdate} with price: ${newPrice}, stock: ${newStock}`
    );
    fs.writeFileSync(
      "./test-results/db-logs/update-product-data.json",
      JSON.stringify(
        {
          product: productToUpdate,
          newPrice,
          newStock,
        },
        null,
        2
      )
    );

    // Get product before update
    const productBefore = await db.get(
      "SELECT * FROM products WHERE name = ?",
      [productToUpdate]
    );

    // Log product before update
    console.log("Product before update:", productBefore);
    fs.writeFileSync(
      "./test-results/db-logs/product-before-update.json",
      JSON.stringify(productBefore, null, 2)
    );

    // Update a product
    const result = await db.run(
      "UPDATE products SET price = ?, stock = ? WHERE name = ?",
      [newPrice, newStock, productToUpdate]
    );

    // Log result
    console.log(`Update result - changes: ${result.changes}`);
    fs.writeFileSync(
      "./test-results/db-logs/update-result.json",
      JSON.stringify(
        {
          changes: result.changes,
        },
        null,
        2
      )
    );

    // Check if update was successful
    expect(result.changes).toBe(1);

    // Verify record was updated
    const product = await db.get("SELECT * FROM products WHERE name = ?", [
      productToUpdate,
    ]);

    // Log product after update
    console.log("Product after update:", product);
    fs.writeFileSync(
      "./test-results/db-logs/product-after-update.json",
      JSON.stringify(product, null, 2)
    );

    expect(product).toBeDefined();
    expect(product.price).toBe(newPrice);
    expect(product.stock).toBe(newStock);
    console.log("Product updated successfully");
  });

  /**
   * INVALID TEST CASE: Update Non-existent Record
   * Test ID: DB-005
   * Description: Tests updating a record that doesn't exist
   * Expected Result: No records are updated
   */
  test("INVALID: Update non-existent record", async () => {
    console.log("Testing update of non-existent record...");

    // Prepare test data
    const nonExistentProduct = "NonExistentProduct";
    const newPrice = 999.99;

    // Log update attempt data
    console.log(
      `Attempting to update non-existent product: ${nonExistentProduct}`
    );
    fs.writeFileSync(
      "./test-results/db-logs/update-nonexistent-data.json",
      JSON.stringify(
        {
          product: nonExistentProduct,
          newPrice,
        },
        null,
        2
      )
    );

    // Update a non-existent product
    const result = await db.run(
      "UPDATE products SET price = ? WHERE name = ?",
      [newPrice, nonExistentProduct]
    );

    // Log result
    console.log(
      `Update result for non-existent product - changes: ${result.changes}`
    );
    fs.writeFileSync(
      "./test-results/db-logs/update-nonexistent-result.json",
      JSON.stringify(
        {
          changes: result.changes,
        },
        null,
        2
      )
    );

    // Check that no records were updated
    expect(result.changes).toBe(0);
    console.log("No records updated as expected");
  });

  /**
   * VALID TEST CASE: Delete Record
   * Test ID: DB-006
   * Description: Tests deleting an existing record
   * Expected Result: Record is successfully deleted
   */
  test("VALID: Delete record from database", async () => {
    console.log("Testing delete operation...");

    // Prepare test data
    const userToDelete = "testuser2";

    // Log delete data
    console.log(`Deleting user: ${userToDelete}`);
    fs.writeFileSync(
      "./test-results/db-logs/delete-user-data.json",
      JSON.stringify(
        {
          username: userToDelete,
        },
        null,
        2
      )
    );

    // Get user before delete to confirm it exists
    const userBefore = await db.get("SELECT * FROM users WHERE username = ?", [
      userToDelete,
    ]);

    // Log user before delete
    console.log("User before delete:", userBefore);
    fs.writeFileSync(
      "./test-results/db-logs/user-before-delete.json",
      JSON.stringify(userBefore, null, 2)
    );

    // Verify user exists before delete
    expect(userBefore).toBeDefined();

    // Delete a user
    const result = await db.run("DELETE FROM users WHERE username = ?", [
      userToDelete,
    ]);

    // Log result
    console.log(`Delete result - changes: ${result.changes}`);
    fs.writeFileSync(
      "./test-results/db-logs/delete-result.json",
      JSON.stringify(
        {
          changes: result.changes,
        },
        null,
        2
      )
    );

    // Check if delete was successful
    expect(result.changes).toBe(1);

    // Verify record was deleted
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      userToDelete,
    ]);

    // Log user after delete
    console.log("User after delete:", user);
    if (user) {
      fs.writeFileSync(
        "./test-results/db-logs/user-after-delete.json",
        JSON.stringify(user, null, 2)
      );
    } else {
      fs.writeFileSync(
        "./test-results/db-logs/user-after-delete.json",
        JSON.stringify({ status: "User deleted successfully" }, null, 2)
      );
    }

    expect(user).toBeUndefined();
    console.log("User deleted successfully");
  });

  /**
   * INVALID TEST CASE: Delete Non-existent Record
   * Test ID: DB-007
   * Description: Tests deleting a record that doesn't exist
   * Expected Result: No records are deleted
   */
  test("INVALID: Delete non-existent record", async () => {
    console.log("Testing delete of non-existent record...");

    // Prepare test data
    const nonExistentUser = "nonexistentuser";

    // Log delete attempt data
    console.log(`Attempting to delete non-existent user: ${nonExistentUser}`);
    fs.writeFileSync(
      "./test-results/db-logs/delete-nonexistent-data.json",
      JSON.stringify(
        {
          username: nonExistentUser,
        },
        null,
        2
      )
    );

    // Delete a non-existent user
    const result = await db.run("DELETE FROM users WHERE username = ?", [
      nonExistentUser,
    ]);

    // Log result
    console.log(
      `Delete result for non-existent user - changes: ${result.changes}`
    );
    fs.writeFileSync(
      "./test-results/db-logs/delete-nonexistent-result.json",
      JSON.stringify(
        {
          changes: result.changes,
        },
        null,
        2
      )
    );

    // Check that no records were deleted
    expect(result.changes).toBe(0);
    console.log("No records deleted as expected");
  });

  /**
   * VALID TEST CASE: Complex Query with JOIN
   * Test ID: DB-008
   * Description: Tests a complex SQL query with JOIN operations
   * Expected Result: Correct results are returned from the JOIN query
   */
  test("VALID: Complex query with JOIN", async () => {
    console.log("Testing complex JOIN query...");

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

    // Log schema creation
    console.log("Created orders table with foreign keys");

    // Add some order data
    await db.exec(`
      INSERT INTO orders (user_id, product_id, quantity) VALUES
        (1, 1, 1),
        (1, 3, 2);
    `);

    // Log data insertion
    console.log("Inserted test orders");

    // Get inserted orders for logging
    const insertedOrders = await db.all("SELECT * FROM orders");
    fs.writeFileSync(
      "./test-results/db-logs/inserted-orders.json",
      JSON.stringify(insertedOrders, null, 2)
    );

    // Run a JOIN query
    const joinQuery = `
      SELECT u.username, p.name as product_name, o.quantity
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      WHERE u.username = 'testuser1'
    `;

    // Log query
    console.log("Executing JOIN query:", joinQuery);
    fs.writeFileSync("./test-results/db-logs/join-query.txt", joinQuery);

    const orders = await db.all(joinQuery);

    // Log query results
    console.log("JOIN query results:", orders);
    fs.writeFileSync(
      "./test-results/db-logs/join-query-results.json",
      JSON.stringify(orders, null, 2)
    );

    // Verify complex query results
    expect(orders).toBeInstanceOf(Array);
    expect(orders.length).toBe(2);
    expect(orders[0].username).toBe("testuser1");
    expect(orders[0].product_name).toBe("Laptop");
    expect(orders[0].quantity).toBe(1);
    expect(orders[1].product_name).toBe("Headphones");
    expect(orders[1].quantity).toBe(2);
    console.log("Complex JOIN query returned correct results");
  });

  /**
   * INVALID TEST CASE: Query with Invalid SQL Syntax
   * Test ID: DB-009
   * Description: Tests a query with invalid SQL syntax
   * Expected Result: Query fails with syntax error
   */
  test("INVALID: Query with invalid SQL syntax", async () => {
    console.log("Testing query with invalid SQL syntax...");

    // Prepare invalid SQL query with syntax error
    const invalidQuery = "SELECT * FORM users"; // Intentional "FORM" instead of "FROM"

    // Log invalid query
    console.log("Executing invalid SQL query:", invalidQuery);
    fs.writeFileSync("./test-results/db-logs/invalid-query.txt", invalidQuery);

    try {
      // Attempt to execute invalid query
      await db.all(invalidQuery);

      // If we get here, the test should fail because an exception should have been thrown
      console.log(
        "UNEXPECTED: Invalid query succeeded when it should have failed"
      );
      expect(false).toBe(true); // Force test to fail
    } catch (error) {
      // Log the error
      console.log("Expected error occurred:", error.message);
      fs.writeFileSync(
        "./test-results/db-logs/invalid-query-error.json",
        JSON.stringify(
          {
            message: error.message,
          },
          null,
          2
        )
      );

      // Verify error is related to syntax
      expect(error.message).toContain("syntax error");
      console.log("Invalid SQL syntax correctly caused query failure");
    }
  });
});