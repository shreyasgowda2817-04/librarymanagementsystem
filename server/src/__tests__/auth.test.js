import request from 'supertest';
import { app } from '../server.js';
import User from '../models/user.js';

describe('Authentication API', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'student'
  };

  it('should successfully register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    
    // Verify user is actually saved in db
    const savedUser = await User.findOne({ email: testUser.email });
    expect(savedUser).toBeTruthy();
    expect(savedUser.name).toBe(testUser.name);
  });

  it('should login an existing user', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser);

    // Then try to login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.email).toBe(testUser.email);
  });

  it('should fail login with incorrect password', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser);

    // Try login with bad password
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect(response.body.token).toBeUndefined();
  });
});
