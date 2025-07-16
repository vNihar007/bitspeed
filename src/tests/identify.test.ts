import request from 'supertest';
import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server';
import  app from '../../app';
import {Contact} from '../models/Contact';


let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'bitespeed_test' });
});

afterEach(async () => {
  await Contact.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /identify', () => {
  it('should create a new primary contact if none exists', async () => {
    const res = await request(app).post('/identify').send({
      email: 'doc@future.com',
      phoneNumber: '1234567890'
    });

    expect(res.status).toBe(200);
    expect(res.body.contact.primaryContatctId).toBeDefined();
    expect(res.body.contact.emails).toContain('doc@future.com');
    expect(res.body.contact.phoneNumbers).toContain('1234567890');
    expect(res.body.contact.secondaryContactIds).toEqual([]);
  });

  it('should link a new contact as secondary if phoneNumber matches existing', async () => {
    const primary = await Contact.create({
      email: 'doc@future.com',
      phoneNumber: '1234567890',
      linkPrecedence: 'primary'
    });

    const res = await request(app).post('/identify').send({
      email: 'mcfly@future.com',
      phoneNumber: '1234567890'
    });

    expect(res.status).toBe(200);
    expect(res.body.contact.primaryContatctId).toEqual(primary.id);
    expect(res.body.contact.emails).toEqual(
      expect.arrayContaining(['doc@future.com', 'mcfly@future.com'])
    );
    expect(res.body.contact.secondaryContactIds.length).toBe(1);
  });

  it('should return 400 if both email and phoneNumber are missing', async () => {
    const res = await request(app).post('/identify').send({});
    expect(res.status).toBe(400);
  });
});

