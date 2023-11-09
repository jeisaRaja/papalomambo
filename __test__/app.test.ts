import request from "supertest";
import {app} from '../src/app'
describe('app.ts', ()=>{
  test('root route', async()=>{
    const res = await request(app).get("/");
    expect(res.text).toEqual("Hello world!");
  })
})