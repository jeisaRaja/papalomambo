import 'dotenv/config';
import './config/db';
import {app} from './app';

app.listen(3001, ()=>{
  console.log('Server is running');
})

console.log(process.env.EMAIl)
