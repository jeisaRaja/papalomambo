import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  password: String,
  phoneNumber: String,
});

export const User = mongoose.model('user', userSchema);
