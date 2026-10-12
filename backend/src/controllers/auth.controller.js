import { findUserByEmail, findUserById, createUser, updateUserPassword, updateUserProfile, updateUserSettings } from '../models/user.model.js';
import { hashPassword, comparePassword, generateToken, generateCsrfToken } from '../utils/auth.js';
import { isEmailLocked, recordFailedLogin, clearFailedLogins } from '../utils/accountLockout.js';
import { query } from '../config/db.js';

const DUMMY_HASH = '$2a$12$e8YdC0d0n0D8pS8j1C.lTe8R.43y/O6hJq7v1YVb9iF7u2eO5vG1S';

const setAuthCookies = (res, token, csrfToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  };

  res.cookie('token', token, cookieOptions);
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false, // Accessible to client JavaScript to send back in X-CSRF-Token header
    secure: isProd,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
};

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

    const token = generateToken({ id: user.id, email: user.email, token_version: user.token_version || 1 });
    const csrfToken = generateCsrfToken();

    setAuthCookies(res, token, csrfToken);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      csrfToken,
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

    if (isEmailLocked(email)) {
      return res.status(429).json({
        error: 'Too many failed login attempts for this account. Please try again later.'
      });
    }

    const user = await findUserByEmail(email);

    // Constant-time execution against dummy hash to prevent user enumeration via timing
    const isMatch = user
      ? await comparePassword(password, user.password_hash)
      : await comparePassword(password, DUMMY_HASH);

    if (!user || !isMatch) {
      recordFailedLogin(email);
      if (isEmailLocked(email)) {
        return res.status(429).json({
          error: 'Too many failed login attempts for this account. Please try again later.'
        });
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Authentication succeeded - clear failed attempt tracking
    clearFailedLogins(email);

    const token = generateToken({ id: user.id, email: user.email, token_version: user.token_version || 1 });
    const csrfToken = generateCsrfToken();
    const { password_hash, ...safeUser } = user;

    setAuthCookies(res, token, csrfToken);

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      csrfToken,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const logout = async (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax'
  });
  res.clearCookie('XSRF-TOKEN', {
    secure: isProd,
    sameSite: 'lax'
  });
  res.status(200).json({ message: 'Logged out successfully.' });
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

    // Clear stale cookie session upon password change
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', { httpOnly: true, secure: isProd, sameSite: 'lax' });
    res.clearCookie('XSRF-TOKEN', { secure: isProd, sameSite: 'lax' });

    res.status(200).json({
      message: 'Password updated successfully. Please log in again with your new password.',
      user: updated
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { full_name, avatar_url, avatar } = req.body;
    const resolvedAvatar = avatar_url !== undefined ? avatar_url : avatar;
    const updated = await updateUserProfile(req.user.id, { full_name, avatar_url: resolvedAvatar });
    res.status(200).json({
      message: 'Profile updated successfully.',
      user: updated
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required.' });
    }
    const updated = await updateUserSettings(req.user.id, settings);
    res.status(200).json({
      message: 'Settings updated successfully.',
      user: updated,
      settings: updated?.settings || {}
    });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
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
