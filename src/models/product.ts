import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema({
  src: String,
});

const productSchema = new mongoose.Schema({
  title: String,
  image: productImageSchema,
  retailPrice: String,
  msrp: String,
  description: String,
  inStock: Boolean,
});

export const Product = mongoose.model('product', productSchema);