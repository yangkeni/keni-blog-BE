import { db } from '../db.js';
import bcrypt from 'bcryptjs';

export const register = (req, res) => {
  // check user exist
  const userQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
  const { username, email, password } = req.body;
  db.query(userQuery, [username, email], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length) return res.status(409).json('User already exist!');

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
  res.json('login');
};

export const logout = (req, res) => {
  res.json('logout');
};
