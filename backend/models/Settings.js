const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // General Settings
  siteName: { type: String, default: 'LoopJS Management Panel' },
  adminEmail: { type: String, default: 'admin@loopjs.com' },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  autoRefresh: { type: Boolean, default: true },
  refreshInterval: { type: Number, default: 30 },
  
  // Security Settings
  sessionTimeout: { type: Number, default: 60 },
  maxLoginAttempts: { type: Number, default: 5 },
  requireStrongPasswords: { type: Boolean, default: true },
  enableTwoFactor: { type: Boolean, default: false },
  allowRemoteAccess: { type: Boolean, default: true },
  
  // Appearance Settings
  theme: { type: String, default: 'dark' },
  primaryColor: { type: String, default: '#3C50E0' },
  sidebarCollapsed: { type: Boolean, default: false },
  showNotifications: { type: Boolean, default: true },
  compactMode: { type: Boolean, default: false },
  
  // AI Settings
  aiEnabled: { type: Boolean, default: false },
  aiProvider: { type: String, default: 'gemini' }, // 'gemini', 'vllm', 'unified'
  aiPrimaryProvider: { type: String, default: 'gemini' },
  aiUseVLLMAsBackup: { type: Boolean, default: true },
  vllmTrained: { type: Boolean, default: false },
  huggingfaceApiKey: { type: String, default: '' },
  vllmApiKey: { type: String, default: '' },
  
  // Telegram Settings
  telegramEnabled: { type: Boolean, default: false },
  telegramBotToken: { type: String, default: '' },
  telegramChatId: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);