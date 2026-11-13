import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, ENV.JWT_ACCESS_SECRET, {
    expiresIn: '7d'
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

export const setAuthCookie = (res, token) => {
  const isProd = ENV.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.COOKIE_SECURE || isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const clearAuthCookie = (res) => {
  const isProd = ENV.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: ENV.COOKIE_SECURE || isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
};
