import supertest from "supertest";
import { app } from "../../src/app";
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from "mongoose";
import { User } from "../../src/models/user";
import { transporter } from "../../src/config/config";
import jwt from "jsonwebtoken";
import 'dotenv/config';
import { SentMessageInfo } from "nodemailer";

jest.spyOn(transporter, "sendMail");
jest.mocked(transporter.sendMail).mockImplementation(async () => { return undefined as SentMessageInfo });

const populateUsers = async () => {
  await User.create({
    username: 'owner',
    password: 'password',
    roles: ['owner'],
    verification: "approved",
    accountAccess: true
  });
  await User.create({
    username: 'admin',
    password: 'password',
    roles: ['admin'],
    verification: "approved",
    accountAccess: true
  });
  await User.create({
    username: 'editor',
    password: 'password',
    roles: ['editor'],
    verification: "approved",
    accountAccess: true
  });
  await User.create({
    username: 'viewer',
    password: 'password',
    roles: ['viewer'],
    verification: "approved",
    accountAccess: true
  });
  await User.create({
    username: 'none@mail.com',
    password: 'password',
    verification: 'none'
  })
  await User.create({
    username: 'pending@mail.com',
    password: 'password',
    verification: 'pending'
  })
}

const clearDb = async () => {
  await User.deleteMany({});
}

const postRequest = async (reqUser: string = '', endpoint: string, payload: object) => {
  let request = supertest(app).post(`/api/v1/auth${endpoint}`);

  if (reqUser !== '') {
    const token = jwt.sign({
      username: reqUser,
      accountAccess: true,
    }, process.env.JWT_SECRET!);

    request = request.set('Authorization', `Bearer ${token}`);
  }

  return await request.send(payload);
}

describe('Auth route', () => {
  beforeAll(async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  })

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
  })

  describe('create employee account', () => {
    const createAccountUrl = '/users'
    describe('request user is owner', () => {
      beforeAll(async () => {
        await populateUsers();
      });

      afterAll(async () => {
        await clearDb();
      });

      describe('given request payload is valid', () => {
        it('creates user document in our database', async () => {
          const payload = { username: 'newEmployee@email.com' }
          const res = await postRequest('admin', createAccountUrl, payload);
          expect(res.status).toBe(200);
          const user = await User.findOne({ username: payload.username });
          expect(user).toBeDefined();
          expect(transporter.sendMail).toHaveBeenCalled();
        })
      })

      describe('given request payload is invalid', () => {
        it('creates user document in our database', async () => {
          const payload = { username: 'something@mail.com', newProps: 'mailware' };
          const res = await postRequest('admin', createAccountUrl, payload);
          expect(res.status).toBe(400);
        })
      })

      describe('given employee account already exist', () => {
        const payload = {
          username: 'none@mail.com'
        }
        it('creates user document in our database', async () => {
          const res = await postRequest('admin', createAccountUrl, payload);
          expect(res.status).toBe(400)
        })
      })
    })

    describe('request user is not admin or owner', () => {
      describe('given request payload is valid', () => {
        const payload = { username: 'test@gmail.com' };

        it('creates user document in our database', async () => {
          const res = await postRequest('editor', createAccountUrl, payload);
          expect(res.status).toBe(401);
        })
      })
    })
  })

  describe('send signup url', () => {
    const signupUrl  = '/users/signup-url'
    describe('request user is owner/admin', () => {
      beforeAll(async () => {
        await populateUsers();
      });

      afterAll(async () => {
        await clearDb();
      });

      describe('given request payload is valid', () => {
        const payload = {
          username: 'none@mail.com'
        }

        it('send url to employee email', async () => {
          const res = await postRequest('admin', signupUrl, payload);
          const user = await User.findOne({ username: payload.username });
          expect(res.status).toBe(200)
          expect(user).toBeDefined();
          expect(transporter.sendMail).toHaveBeenCalled();
        })
      })

      describe('given request payload is invalid', () => {
        const payload = {
          username: 'test2@gmail.com',
          additionalProps: '123',
        }
        it('send url to employee email', async () => {
          const res = await postRequest('admin', signupUrl, payload);
          expect(res.status).toBe(400);
        })
      })

      describe('employee account not exist', () => {
        const payload = { username: 'notexist@gmail.com' }
        it('send url to employee email', async () => {
          const res = await postRequest('admin', signupUrl, payload);
          expect(res.status).toBe(400);
        })
      })

      describe('employee account exist and verification pending', () => {
        const payload = { username: 'pending@mail.com' }
        it('send url to employee email', async () => {
          const res = await postRequest('admin', signupUrl, payload);
          expect(res.status).toBe(400);
        })
      })
    })

    describe('request user not owner/admin', () => {
      beforeAll(async () => {
        await populateUsers();
      });

      afterAll(async () => {
        await clearDb();
      });

      describe('given request payload is valid', () => {
        const payload = {
          username: 'none@mail.com'
        }

        it('send url to employee email', async () => {
          const res = await postRequest('admin', signupUrl, payload);
          expect(res.status).toBe(200);
          const user = await User.findOne({ username: 'test@gmail.com' });
          expect(user).toBeNull();
        })
      })

      describe('given request payload is invalid', () => {
        const payload = {
          username: 'none@mail.com',
          additionalProps: '123',
        }
        it('send url to employee email', async () => {
          const res = await postRequest('admin', signupUrl, payload);
          expect(res.status).toBe(400);
        })
      })
    })

  })

  describe('employee login', () => {
    const loginUrl = '/login'
    beforeAll(async () => {
      await populateUsers();
    })

    afterAll(async () => {
      await clearDb();
    })

    describe('Account exist', () => {
      describe('invalid payload', () => {
        it('too few payload props', async () => {
          const payload = { username: 'admin' };
          const res = await postRequest('', loginUrl, payload);
          expect(res.status).toBe(400);
        })

        it('too many payload props', async () => {
          const payload = {username : 'admin', password: 'password'};
          const res = await postRequest('', '/login', payload)
        })
      })
    })

  })
})
