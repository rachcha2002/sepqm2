// @ts-check
const { test, expect } = require("@playwright/test");
const fs = require("fs");

/**
 * API Testing Suite
 * Tests REST API endpoints functionality
 * Includes both valid and invalid API requests
 */
test.describe("API Testing", () => {
  // Using JSONPlaceholder - a free fake API for testing
  const baseUrl = "https://jsonplaceholder.typicode.com";

  // Create logs directory if it doesn't exist
  if (!fs.existsSync("./test-results/api-logs")) {
    fs.mkdirSync("./test-results/api-logs", { recursive: true });
  }

  /**
   * VALID TEST CASE: GET Request
   * Test ID: API-001
   * Description: Tests retrieving a list of users
   * Expected Result: Returns status 200 and a list of user objects
   */
  test("VALID: GET request - fetch users list", async ({ request }) => {
    console.log("Testing GET request for users list...");

    // Make a GET request to the users endpoint
    const response = await request.get(`${baseUrl}/users`);

    // Log the response status and headers
    console.log(`Response status: ${response.status()}`);
    console.log(`Response status text: ${response.statusText()}`);

    // Verify status code
    expect(response.status()).toBe(200);

    // Get response body
    const users = await response.json();

    // Log response to file for reporting
    fs.writeFileSync(
      "./test-results/api-logs/get-users-response.json",
      JSON.stringify(users, null, 2)
    );

    // Verify response is an array of users
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
    console.log(`Retrieved ${users.length} users`);

    // Verify user structure
    const firstUser = users[0];
    expect(firstUser).toHaveProperty("id");
    expect(firstUser).toHaveProperty("name");
    expect(firstUser).toHaveProperty("email");
    expect(firstUser).toHaveProperty("address");
    console.log("User structure verified successfully");
  });

  /**
   * INVALID TEST CASE: GET Request
   * Test ID: API-002
   * Description: Tests retrieving a non-existent user
   * Expected Result: Returns appropriate status code or empty object
   */
  test("INVALID: GET request - fetch non-existent user", async ({
    request,
  }) => {
    console.log("Testing GET request for non-existent user...");

    // Make a GET request to a non-existent user ID
    const nonExistentId = 9999999;
    const response = await request.get(`${baseUrl}/users/${nonExistentId}`);

    // Log the response status
    console.log(`Response status for non-existent user: ${response.status()}`);

    // Get response body
    const body = await response.json();

    // Log response to file for reporting
    fs.writeFileSync(
      "./test-results/api-logs/get-nonexistent-user-response.json",
      JSON.stringify(body, null, 2)
    );

    // JSONPlaceholder may return 200 with empty object for non-existent resources
    // Either scenario is valid for this test
    if (response.status() === 404) {
      expect(response.status()).toBe(404);
      console.log("API correctly returned 404 for non-existent user");
    } else {
      // Alternatively, verify empty object is returned
      expect(Object.keys(body).length).toBe(0);
      console.log("API returned empty object for non-existent user");
    }
  });

  /**
   * VALID TEST CASE: POST Request
   * Test ID: API-003
   * Description: Tests creating a new resource
   * Expected Result: Returns status 201 and the created resource
   */
  test("VALID: POST request - create new post", async ({ request }) => {
    console.log("Testing POST request to create new post...");

    // Prepare data for new post
    const postData = {
      userId: 1,
      title: "New Test Post",
      body: "This is a test post created during automated testing",
    };

    // Log request payload
    console.log("POST request payload:", postData);
    fs.writeFileSync(
      "./test-results/api-logs/post-request-payload.json",
      JSON.stringify(postData, null, 2)
    );

    // Make a POST request to create a new post
    const response = await request.post(`${baseUrl}/posts`, {
      data: postData,
    });

    // Log the response status
    console.log(`Response status: ${response.status()}`);

    // Verify status code
    expect(response.status()).toBe(201);

    // Get response body
    const body = await response.json();

    // Log response to file for reporting
    fs.writeFileSync(
      "./test-results/api-logs/post-response.json",
      JSON.stringify(body, null, 2)
    );

    // Verify response structure
    expect(body).toHaveProperty("id");
    expect(body.title).toBe(postData.title);
    expect(body.body).toBe(postData.body);
    expect(body.userId).toBe(postData.userId);
    console.log(`Successfully created post with id: ${body.id}`);
  });

  /**
   * INVALID TEST CASE: POST Request
   * Test ID: API-004
   * Description: Tests creating a resource with invalid data
   * Expected Result: Returns appropriate error status or message
   */
  test("INVALID: POST request - create post with invalid data", async ({
    request,
  }) => {
    console.log("Testing POST request with invalid data...");

    // Prepare invalid data (missing required fields)
    const invalidPostData = {
      // Missing userId, which might be required
      title: "Invalid Post",
      // Missing body field
    };

    // Log request payload
    console.log("Invalid POST request payload:", invalidPostData);
    fs.writeFileSync(
      "./test-results/api-logs/invalid-post-request-payload.json",
      JSON.stringify(invalidPostData, null, 2)
    );

    // Make a POST request with invalid data
    const response = await request.post(`${baseUrl}/posts`, {
      data: invalidPostData,
    });

    // Log the response status
    console.log(`Response status for invalid data: ${response.status()}`);

    // Get response body
    const body = await response.json();

    // Log response to file for reporting
    fs.writeFileSync(
      "./test-results/api-logs/invalid-post-response.json",
      JSON.stringify(body, null, 2)
    );

    // JSONPlaceholder might still return 201 even with invalid data
    // We should verify the response structure reflects our input
    expect(body).toHaveProperty("id");
    expect(body.title).toBe(invalidPostData.title);

    // Verify missing fields are absent or null in response
    expect(body.body).toBeFalsy();
    console.log("API response correctly reflects missing fields in request");
  });

  /**
   * VALID TEST CASE: PUT Request
   * Test ID: API-005
   * Description: Tests updating an existing resource
   * Expected Result: Returns status 200 and the updated resource
   */
  test("VALID: PUT request - update post", async ({ request }) => {
    console.log("Testing PUT request to update post...");

    // Prepare updated data
    const updatedPostData = {
      userId: 1,
      id: 1,
      title: "Updated Post Title",
      body: "This post has been updated via API test",
    };

    // Log request payload
    console.log("PUT request payload:", updatedPostData);
    fs.writeFileSync(
      "./test-results/api-logs/put-request-payload.json",
      JSON.stringify(updatedPostData, null, 2)
    );

    // Make a PUT request to update a post
    const response = await request.put(`${baseUrl}/posts/1`, {
      data: updatedPostData,
    });

    // Log the response status
    console.log(`Response status: ${response.status()}`);

    // Verify status code
    expect(response.status()).toBe(200);

    // Get response body
    const body = await response.json();

    // Log response to file for reporting
    fs.writeFileSync(
      "./test-results/api-logs/put-response.json",
      JSON.stringify(body, null, 2)
    );

    // Verify response structure
    expect(body.title).toBe(updatedPostData.title);
    expect(body.body).toBe(updatedPostData.body);
    console.log("Post updated successfully");
  });

  /**
   * VALID TEST CASE: DELETE Request
   * Test ID: API-006
   * Description: Tests deleting a resource
   * Expected Result: Returns appropriate status code for successful deletion
   */
  test("VALID: DELETE request - remove post", async ({ request }) => {
    console.log("Testing DELETE request to remove post...");

    // Make a DELETE request to remove a post
    const response = await request.delete(`${baseUrl}/posts/1`);

    // Log the response status
    console.log(`Response status for DELETE: ${response.status()}`);

    // Get response body
    const body = await response.json();

    // Log response to file for reporting
    fs.writeFileSync(
      "./test-results/api-logs/delete-response.json",
      JSON.stringify(body, null, 2)
    );

    // Verify status code (JSONPlaceholder returns 200 for DELETE)
    expect(response.status()).toBe(200);
    console.log("Post deleted successfully");
  });

  /**
   * INVALID TEST CASE: DELETE Request
   * Test ID: API-007
   * Description: Tests deleting a non-existent resource
   * Expected Result: Returns appropriate error status or empty response
   */
  test("INVALID: DELETE request - remove non-existent post", async ({
    request,
  }) => {
    console.log("Testing DELETE request for non-existent post...");

    // Make a DELETE request to a non-existent post ID
    const nonExistentId = 9999999;
    const response = await request.delete(`${baseUrl}/posts/${nonExistentId}`);

    // Log the response status
    console.log(
      `Response status for deleting non-existent post: ${response.status()}`
    );

    // Get response body
    const body = await response.json();

    // Log response to file for reporting
    fs.writeFileSync(
      "./test-results/api-logs/delete-nonexistent-response.json",
      JSON.stringify(body, null, 2)
    );

    // JSONPlaceholder might return 200 even for non-existent resources
    // Verify the response is empty or contains expected error information
    expect(Object.keys(body).length).toBeLessThan(3);
    console.log("API handled deletion of non-existent resource appropriately");
  });
});