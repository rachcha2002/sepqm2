// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('API Testing', () => {
  // Using JSONPlaceholder - a free fake API for testing
  const baseUrl = 'https://jsonplaceholder.typicode.com';

  test('GET request - fetch users list', async ({ request }) => {
    // Make a GET request to the users endpoint
    const response = await request.get(`${baseUrl}/users`);
    
    // Verify status code
    expect(response.status()).toBe(200);
    
    // Verify response is an array of users
    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
    
    // Verify user structure
    const firstUser = users[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('name');
    expect(firstUser).toHaveProperty('email');
    expect(firstUser).toHaveProperty('address');
  });

  test('POST request - create new post', async ({ request }) => {
    // Prepare data for new post
    const postData = {
      userId: 1,
      title: 'New Test Post',
      body: 'This is a test post created during automated testing'
    };
    
    // Make a POST request to create a new post
    const response = await request.post(`${baseUrl}/posts`, {
      data: postData
    });
    
    // Verify status code
    expect(response.status()).toBe(201);
    
    // Verify response structure
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.title).toBe(postData.title);
    expect(body.body).toBe(postData.body);
    expect(body.userId).toBe(postData.userId);
  });

  test('PUT request - update post', async ({ request }) => {
    // Prepare updated data
    const updatedPostData = {
      userId: 1,
      id: 1,
      title: 'Updated Post Title',
      body: 'This post has been updated via API test'
    };
    
    // Make a PUT request to update a post
    const response = await request.put(`${baseUrl}/posts/1`, {
      data: updatedPostData
    });
    
    // Verify status code
    expect(response.status()).toBe(200);
    
    // Verify response structure
    const body = await response.json();
    expect(body.title).toBe(updatedPostData.title);
    expect(body.body).toBe(updatedPostData.body);
  });

  test('PATCH request - partially update post', async ({ request }) => {
    // Prepare partial data for update
    const partialData = {
      title: 'Partially Updated Title'
    };
    
    // Make a PATCH request to update a post
    const response = await request.patch(`${baseUrl}/posts/1`, {
      data: partialData
    });
    
    // Verify status code
    expect(response.status()).toBe(200);
    
    // Verify response structure
    const body = await response.json();
    expect(body.title).toBe(partialData.title);
    // The body field should still exist
    expect(body).toHaveProperty('body');
  });

  test('DELETE request - remove post', async ({ request }) => {
    // Make a DELETE request to remove a post
    const response = await request.delete(`${baseUrl}/posts/1`);
    
    // Verify status code (JSONPlaceholder returns 200 for DELETE)
    expect(response.status()).toBe(200);
  });

  test('API error handling - resource not found', async ({ request }) => {
    // Make a GET request to a non-existent resource
    const response = await request.get(`${baseUrl}/posts/999999`);
    
    // JSONPlaceholder returns an empty object for non-existent resources
    const body = await response.json();
    expect(Object.keys(body).length).toBe(0);
  });
}); 