import mongoose from "mongoose";

mongoose.connect(process.env.MONGODB_URI! )
  .then(()=>console.log('DB connection success'))
  .catch(error => console.log(error));
