import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { User } from '../models/user';

export const authorize = async (req:Request, res:Response, next:NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = token && jwt.verify(token, process.env.JWT_SECRET!);

    if(!(decoded as any)?.accountAccess){
      return res.status(401).send('not authorized');
    }

    if (!(decoded as any).username) {
      return res.status(400).send('Token payload is missing the username');
    }

    const user = await User.findOne({username:(decoded as any).username}, '-password');
    if (!user || (user.verification !== 'approved')) return res.status(401).send('not authorized');
    (req as any).user = user;
    next();
  } catch (e) {
    return res.status(401).send('not authorized');
  }
}

// Check that the token is issued after any kind of password change