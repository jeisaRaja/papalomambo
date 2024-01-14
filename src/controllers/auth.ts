import * as bcrypt from 'bcrypt'
import { User } from '../models/user';
import Ajv from 'ajv';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import 'dotenv/config';
import { transporter, getMailOptions } from '../config/config';
const ajv = new Ajv();

// requires owner or admin role
// creates an account for an employee in the DB, including email and phone number
// sends a link with one-time signup token to the specified email address
// token must have a short expiration time
const validateEmployeeAccount = ajv.compile({
  type: 'object',
  properties: {
    username: { type: 'string' },
  },
  required: ['username'],
  additionalProperties: false,
});
export const createEmployeeAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {

    if (!(req as any).user) {
      throw new Error('request.user is missing');
    }
    const reqUser = await User.findById((req as any).user.id);
    if (!reqUser || (!reqUser.roles.includes('admin') && !reqUser.roles.includes('owner'))) {
      return res.status(401).send('User not authorized!');
    }
    if (!validateEmployeeAccount(req.body)) {
      return res.status(400).send('The data is invalid!');
    }
    if (await User.findOne({ username: (req as any).body.username })) {
      return res.status(400).send('Email with that account already exist!');
    }
    const newUser = await User.create({
      username: (req as any).body.username,
      password: 'password',
      phoneNumber: (req as any).body.phoneNumber,
      verification: 'none',
    })
    const signUpToken = jwt.sign({
      id: newUser._id,
      username: newUser.username,
      accountAccess: false,
    }, process.env.JWT_SECRET as string, { expiresIn: '5m' });
    const signUpUrl = `${process.env.FE_HOST}/signup?token=${signUpToken}`;
    const mailOptions = getMailOptions(newUser.username, 'Registration link', signUpUrl);
    await transporter.sendMail(mailOptions);
    res.send('Email sent');
  } catch (e) {
    next(e);
  }
};

// sends a link with one-time signup token to the specified email address
// used when there are problems with signup and a new signup token is needed
export const sendEmployeeSignupLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user) return res.status(400).send('not authorized');

    const reqUser = await User.findById((req as any).user.id);

    if (!reqUser || (!reqUser.roles.includes('admin') && !reqUser.roles.includes('owner'))) {
      return res.status(400).send('not authorized');
    }

    if (!validateEmployeeAccount(req.body)) return res.status(400).send('request invalid');

    const employeeAccount = await User.findOne({ username: req.body.username });
    if (!employeeAccount) return res.status(400).send('no account with that email');

    if (employeeAccount.verification !== 'none') return res.status(400).send('this account already signed up');

    const signUpToken = jwt.sign({
      username: employeeAccount.username,
    }, process.env.JWT_SECRET as string, { expiresIn: '5m' });

    const signUpUrl = `${process.env.FE_HOST}/signup?token=${signUpToken}`;
    const mailOptions = getMailOptions(employeeAccount.username, 'Registration link', signUpUrl);
    await transporter.sendMail(mailOptions);
    res.send('email sent');
  } catch (e) {
    next(e);
  }

};

// requires signup token received from email
// request includes username and password
// adds "verification pending" status to employee account, awaiting owner approval
const validateEmployeeSignup = ajv.compile({
  type: 'object',
  properties: {
    username: { type: 'string' },
    password: { type: 'string' },
  },
  required: ['username', 'password'],
  additionalProperties: false,
});

export const employeeSignup = async (req: Request, res: Response, next: NextFunction) => {
  if (!validateEmployeeSignup(req.body)) {
    return res.status(400).send('Request payload is invalid');
  }

  const reqUser = await User.findById((req as any).user.id);

  if (!reqUser || (!reqUser.roles.includes('admin') && !reqUser.roles.includes('owner'))) {
    return res.status(400).send('not authorized');
  }

  const employeeAccount = await User.findOne({ username: req.body.username });
  if (!employeeAccount || employeeAccount.verification !== 'none') {
    return res.status(400).send('Request payload is invalid');
  }

  const hashPassword = bcrypt.hashSync(req.body.password, 20);
  employeeAccount.password = hashPassword;
  employeeAccount.verification = 'pending';
  await employeeAccount.save();
};

// requires owner or admin role
// adds "verification complete" status to employee account, allowing employee login
const validateNewEmployee = ajv.compile({
  type: 'object',
  properties: {
    username: { type: 'string' },
  },
  required: ['username'],
  additionalProperties: false,
})
export const approveNewEmployee = async (req: Request, res: Response, next: NextFunction) => {
  if (!validateNewEmployee(req.body)) {
    return res.status(400).send('Request payload is invalid');
  }

  const reqUser = await User.findById((req as any).user.id);

  if (!reqUser || (!reqUser.roles.includes('admin') && !reqUser.roles.includes('owner'))) {
    return res.status(400).send('not authorized');
  }

  const employeeAccount = await User.findOne({ username: req.body.username })
  if (!employeeAccount || employeeAccount.verification !== 'pending') {
    return res.status(400).send('Request payload is invalid');
  }

  employeeAccount.verification = 'approved';
  await employeeAccount.save();
};

const validateEmployeeLogin = ajv.compile({
  type: 'object',
  properties: {
    username: { type: 'string' },
    password: { type: 'string' },
  },
  required: ['username', 'password'],
  additionalProperties: false,
});
// provides auth token given valid credentials and "verification complete" status
export const employeeLogin = async (req: Request, res: Response, next: NextFunction) => {

  if (!validateEmployeeLogin(req.body)) {
    return res.status(400).send('Request payload is invalid');
  }

  const user = await User.findOne({ username: (req as any).body.username });
  if (!user) {
    return res.status(400).send('Request payload is invalid');
  }

  const match = bcrypt.compareSync(req.body.password, user.password as string);
  if (!match) {
    return res.status(400).send('Request payload is invalid');
  }

  if (user.verification !== 'approved') {
    return res.status(400).send('Request payload is invalid');
  }

  const token = jwt.sign({
    id: user._id,
    username: user.username,
    accountAccess: true,
  }, process.env.JWT_SECRET!, { expiresIn: '24h' })

  res.json({ token });
};

// requires ownership role
// adds the "admin" role to an employee's account
// requires "verification complete" status on the employee
export const grantAdminRole = async (req: Request, res: Response, next: NextFunction) => {

};

// requires ownership role
// removes the "owner" role from the owner account, and adds "admin" role to the owner account
// adds "owner" role to the target account
export const transferOwnership = async (req: Request, res: Response, next: NextFunction) => {

};

// requires ownership or admin role
// only owner can delete admins
export const deleteEmployeeAccount = async (req: Request, res: Response, next: NextFunction) => {

};

// requires ownership role
// removes the "admin" role from the target account
export const revokeAdminRole = async (req: Request, res: Response, next: NextFunction) => {

};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {

};
