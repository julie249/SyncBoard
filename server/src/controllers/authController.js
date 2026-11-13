import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { PasswordReset } from '../models/PasswordReset.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/tokens.js';
import { recordActivity } from '../services/activityService.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash
    });

    // Create an initial workspace for the user
    const defaultWorkspace = await Workspace.create({
      name: `${name.split(' ')[0]}'s Workspace`,
      description: 'Default personal workspace',
      owner: user._id,
      members: [{ user: user._id, role: 'admin' }]
    });

    await recordActivity({
      workspaceId: defaultWorkspace._id,
      actorId: user._id,
      action: 'workspace:create',
      description: `${user.name} created workspace ${defaultWorkspace.name}`
    });

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme
      },
      defaultWorkspaceId: defaultWorkspace._id
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, theme } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (theme) updates.theme = theme;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-passwordHash');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists in our system, a reset link has been dispatched.'
      });
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Remove any previous reset tokens for this user
    await PasswordReset.deleteMany({ user: user._id });

    // Save with 1 hour expiration
    await PasswordReset.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    // In a production environment with SMTP, an email would be sent.
    // For local development, we log and return the token for testing convenience.
    console.log(`[Password Reset] Reset token generated for ${email}: ${rawToken}`);

    return res.status(200).json({
      success: true,
      message: 'If that email exists in our system, a reset link has been dispatched.',
      // Return resetToken in dev mode so developer can test easily
      devResetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await PasswordReset.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(resetRecord.user, { passwordHash });
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};
