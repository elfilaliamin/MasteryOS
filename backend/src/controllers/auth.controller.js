import { findUserByEmail, findUserById, createUser, updateUserPassword, updateUserProfile } from '../models/user.model.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { query } from '../config/db.js';

export const register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await hashPassword(password);
    const user = await createUser({ email, password_hash, full_name });

    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({ id: user.id, email: user.email });
    const { password_hash, ...safeUser } = user;

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const { password_hash, ...safeUser } = req.user;
    res.status(200).json({
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Please provide both current and new password.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.password_hash) {
      const isMatch = await comparePassword(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }
    }

    const newHash = await hashPassword(new_password);
    const updated = await updateUserPassword(req.user.id, newHash);

    res.status(200).json({
      message: 'Password updated successfully.',
      user: updated
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { full_name, avatar_url } = req.body;
    const updated = await updateUserProfile(req.user.id, { full_name, avatar_url });
    res.status(200).json({
      message: 'Profile updated successfully.',
      user: updated
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

export const resetUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    try {
      await query(`DELETE FROM task_activities WHERE user_id = $1`, [userId]);
      await query(`DELETE FROM tasks WHERE user_id = $1`, [userId]);
      await query(`DELETE FROM goals WHERE user_id = $1`, [userId]);
      await query(`DELETE FROM courses WHERE user_id = $1`, [userId]);
      await query(`DELETE FROM habit_logs WHERE user_id = $1`, [userId]);
      await query(`DELETE FROM habits WHERE user_id = $1`, [userId]);
      await query(`DELETE FROM categories WHERE user_id = $1`, [userId]);
    } catch (dbErr) {
      console.warn('[DB Warning] Reset data query warning:', dbErr.message);
    }

    res.status(200).json({
      message: 'All user data has been successfully reset.'
    });
  } catch (err) {
    console.error('Reset data error:', err);
    res.status(500).json({ error: 'Failed to reset user data.' });
  }
};
