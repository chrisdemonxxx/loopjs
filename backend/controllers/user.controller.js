const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed for profile pictures', 400), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for profile picture upload
exports.uploadProfilePicture = upload.single('profilePicture');

/**
 * Get current user profile
 */
exports.getProfile = catchAsync(async (req, res, next) => {
  // Check if this is development mode
  if (req.user.id === 'admin-dev-id') {
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: 'admin-dev-id',
          username: 'admin',
          email: 'admin@loopjs.com',
          role: 'admin',
          profilePicture: null,
          displayName: 'Administrator',
          twoFactorEnabled: false,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferences: {}
        }
      }
    });
  }

  // Production mode - fetch from database
  const user = await User.findById(req.user.id).select('-password -refreshTokens');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        displayName: user.displayName || user.username,
        twoFactorEnabled: user.twoFactorEnabled || false,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        preferences: user.preferences || {}
      }
    }
  });
});

/**
 * Update user profile
 */
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { username, email, displayName, preferences } = req.body;
  
  // Check if username or email already exists (excluding current user)
  if (username) {
    const existingUser = await User.findOne({ 
      username: username, 
      _id: { $ne: req.user.id } 
    });
    if (existingUser) {
      return next(new AppError('Username already exists', 400));
    }
  }
  
  if (email) {
    const existingUser = await User.findOne({ 
      email: email, 
      _id: { $ne: req.user.id } 
    });
    if (existingUser) {
      return next(new AppError('Email already exists', 400));
    }
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (displayName) updateData.displayName = displayName;
  if (preferences) updateData.preferences = preferences;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        displayName: user.displayName,
        preferences: user.preferences || {}
      }
    }
  });
});

/**
 * Upload profile picture
 */
exports.uploadProfilePictureHandler = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No profile picture uploaded', 400));
  }

  const user = await User.findById(req.user.id);
  
  // Delete old profile picture if exists
  if (user.profilePicture) {
    const oldPicturePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profilePicture));
    try {
      await fs.unlink(oldPicturePath);
    } catch (error) {
      console.log('Old profile picture not found or already deleted');
    }
  }

  // Update user with new profile picture path
  const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
  user.profilePicture = profilePicturePath;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile picture uploaded successfully',
    data: {
      profilePicture: profilePicturePath
    }
  });
});

/**
 * Change password
 */
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new AppError('All password fields are required', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('New passwords do not match', 400));
  }

  if (newPassword.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  const user = await User.findById(req.user.id).select('+password');
  
  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Update password
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully'
  });
});

/**
 * Enable/Disable Two-Factor Authentication
 */
exports.toggleTwoFactor = catchAsync(async (req, res, next) => {
  const { enabled } = req.body;

  const user = await User.findById(req.user.id);
  user.twoFactorEnabled = enabled;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
    data: {
      twoFactorEnabled: user.twoFactorEnabled
    }
  });
});

/**
 * Get user sessions
 */
exports.getSessions = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('refreshTokens');
  
  const sessions = user.refreshTokens.map(token => ({
    id: token._id,
    createdAt: token.createdAt,
    lastUsed: token.lastUsed,
    userAgent: token.userAgent,
    ipAddress: token.ipAddress,
    isCurrent: token.token === req.user.refreshToken
  }));

  res.status(200).json({
    status: 'success',
    data: {
      sessions
    }
  });
});

/**
 * Revoke session
 */
exports.revokeSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const user = await User.findById(req.user.id);
  
  // Remove the session
  user.refreshTokens = user.refreshTokens.filter(token => token._id.toString() !== sessionId);
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Session revoked successfully'
  });
});

/**
 * Revoke all sessions except current
 */
exports.revokeAllSessions = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Keep only the current session
  const currentToken = req.user.refreshToken;
  user.refreshTokens = user.refreshTokens.filter(token => token.token === currentToken);
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'All other sessions revoked successfully'
  });
});

/**
 * Delete user account
 */
exports.deleteAccount = catchAsync(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new AppError('Password confirmation is required', 400));
  }

  const user = await User.findById(req.user.id).select('+password');
  
  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new AppError('Password is incorrect', 400));
  }

  // Delete profile picture if exists
  if (user.profilePicture) {
    const picturePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profilePicture));
    try {
      await fs.unlink(picturePath);
    } catch (error) {
      console.log('Profile picture not found or already deleted');
    }
  }

  // Delete user account
  await User.findByIdAndDelete(req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Account deleted successfully'
  });
});

module.exports = {
  getProfile: exports.getProfile,
  updateProfile: exports.updateProfile,
  uploadProfilePicture: exports.uploadProfilePicture,
  uploadProfilePictureHandler: exports.uploadProfilePictureHandler,
  changePassword: exports.changePassword,
  toggleTwoFactor: exports.toggleTwoFactor,
  getSessions: exports.getSessions,
  revokeSession: exports.revokeSession,
  revokeAllSessions: exports.revokeAllSessions,
  deleteAccount: exports.deleteAccount
};
