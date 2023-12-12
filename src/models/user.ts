import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: String,
  roles:{
    type: [String],
    enum: ['owner', 'admin', 'editor', 'viewer']
  },
  verification: {
    type: String,
    enum: ['none', 'pending', 'approved']
  }
});

export const User = mongoose.model('user', userSchema);
