import { db } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { STATUSCODE } from './statusCode.js';

export const register = async(req, res) => {
  // check user exist
  const userQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
  const { username, email, password } = req.body;
  try {
    const [ userRes ] = await db.query(userQuery, [email, username]);
    if (userRes.length) 
      return res.status(STATUSCODE.CONFLICT).json('User already exist');
    // hash password and salt it
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt);

    const insertUserQuery =
      'INSERT INTO users(`username`, `email`, `password`) VALUES (?)';
    const values = [username, email, hash];

    const [ insertUserRes ] = await db.query(insertUserQuery, [values]);
    return res.status(STATUSCODE.SUCCESS).json(insertUserRes);
  } catch (error) {
    console.warn(error);
    return res.status(STATUSCODE.DB_ERROR).json({
      state: 'register error',
      error
    })
  }
};

export const login = async(req, res) => {
  const userQuery = 'SELECT * FROM users WHERE username = ?';
  const { username, password: reqPassword } = req.body;
  try {
    const [ userRes ] = await db.query(userQuery, [username, reqPassword]);
    if (!userRes.length) 
      return res.status(STATUSCODE.DELETE_ERROR).json('user does not exist');
    const isPassword = bcrypt.compareSync(reqPassword, userRes[0].password);
    if (!isPassword) return res.status(STATUSCODE.WRONG_REQ).json('wrong username or password');
    const { password, ...other } = userRes[0];
    const token = jwt.sign({ id: userRes[0].id }, process.env.JWT_KEY);
    res
      .cookie('access_token', token, {
        httpOnly: true,
      })
      .status(STATUSCODE.SUCCESS)
      .json(other);
  } catch (error) {
    console.warn(error);
    return res.status(STATUSCODE.DB_ERROR).json({
      state: 'get user error',
      error
    })
  }
};

export const logout = (req, res) => {
  res
    .clearCookie('access_token', {
      domain: 'localhost',
      path: '/',
      sameSite: 'none',
      secure: true,
    })
    .status(STATUSCODE.SUCCESS)
    .json('User has been logged out.');
};
