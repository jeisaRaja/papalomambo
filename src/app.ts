import express  from "express";
import mongoose from "mongoose";
import 'dotenv/config'
import { router as usersRouter } from "./routes/users";

const app = express()
mongoose.connect(process.env.MONGODB_URI! )
.then(()=>console.log('DB connection success'))
.catch(error => console.log(error));

app.get('/', (req,res)=>{
  res.send('Hello world!')
})
app.use('/api/v1/users', usersRouter)
export {app}