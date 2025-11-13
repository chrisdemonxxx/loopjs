const Settings = require('../models/Settings');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get application settings
 */
exports.getSettings = catchAsync(async (req, res, next) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = new Settings();
    await settings.save();
  }

  res.status(200).json({
    status: 'success',
    settings: settings
  });
});

/**
 * Update application settings
 */
exports.updateSettings = catchAsync(async (req, res, next) => {
  const { settings } = req.body;
  
  if (!settings) {
    return next(new AppError('Settings data is required', 400));
  }

  let existingSettings = await Settings.findOne();
  
  if (!existingSettings) {
    existingSettings = new Settings(settings);
  } else {
    Object.assign(existingSettings, settings);
  }
  
  await existingSettings.save();

  res.status(200).json({
    status: 'success',
    message: 'Settings updated successfully',
    settings: existingSettings
  });
});