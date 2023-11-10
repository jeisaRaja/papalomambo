import { Request, Response } from "express";
import { User } from "../models/user";

console.log(User);

export const getUser = (req:Request,res:Response) => {
  res.send('user');
};