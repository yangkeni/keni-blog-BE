import { db } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = (req, res) => {
  // check user exist
  const userQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
  const { username, email, password } = req.body;
  db.query(userQuery, [email, username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length) return res.status(409).json('User already exist');
    // hash password and salt it
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt);

    const insertUserQuery =
      'INSERT INTO users(`username`, `email`, `password`) VALUES (?)';
    const values = [username, email, hash];

    db.query(insertUserQuery, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json(data);
    });
  });
};

export const login = (req, res) => {
  const userQuery = 'SELECT * FROM users WHERE username = ?';
  const { username, password: reqPassword } = req.body;
  db.query(userQuery, [username, reqPassword], (err, data) => {
    if (err) return res.status(500).json(err);
    if (!data.length) return res.status(404).json('user does not exist');

    const isPassword = bcrypt.compareSync(reqPassword, data[0].password);
    if (!isPassword) return res.status(400).json('wrong username or password');
    const { password, ...other } = data[0];
    const token = jwt.sign({ id: data[0].id }, process.env.JWT_KEY);
    
    res
      .cookie('access_token', token, {
        httpOnly: true,
      })
      .status(200)
      .json(other);
  });
};

export const logout = (req, res) => {
  res
    .clearCookie('access_token', {
      domain: 'localhost',
      path: '/',
      sameSite: 'none',
      secure: true,
    })
    .status(200)
    .json('User has been logged out.');
};
