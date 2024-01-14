import { Request, Response } from "express";
import Ajv from "ajv";
import { Product } from "../models/product";

const ajv = new Ajv();

const createProductRequestSchema = {
  type: 'object',
  properties: {
    title: {type: 'string'},
    description: {type: 'string'},
    retailPrice: {type: 'number'},
    msrp: {type: 'number'},
    imageUrl: {type: 'string'},
  },
  required: ['title', 'description', 'msrp', 'imageUrl'],
  additionalProperties: false,
};

const validate = ajv.compile(createProductRequestSchema);

export const createProduct = async (req:Request, res:Response) => {
  const requestValid = validate(req.body);
  if(requestValid){
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } else {
    res.status(400).json(validate.errors);
  }
}; 