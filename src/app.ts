import express  from "express";
import { router as usersRouter } from "./routes/users";
const app = express()
app.get('/', (req,res)=>{
  res.send('Hello world!')
})
app.use('/api/v1/users', usersRouter)
export {app}