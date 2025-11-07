import toast, { ToastOptions } from 'react-hot-toast';
import { soundService } from './soundService';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'connection' | 'disconnection' | 'custom';

interface SoundToastOptions extends ToastOptions {
  playSound?: boolean;
  soundType?: 'connection' | 'disconnection' | 'custom' | 'success' | 'error' | 'info' | 'warning';
}

class ToastService {
  private getThemeMode(): string {
    // Get theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  }

  private async playToastSound(soundType: string) {
    const theme = this.getThemeMode();
    soundService.setTheme(theme);

    switch (soundType) {
      case 'connection':
        await soundService.playConnectionSound();
        break;
      case 'disconnection':
        await soundService.playDisconnectionSound();
        break;
      case 'success':
        await soundService.playSuccessSound();
        break;
      case 'error':
        await soundService.playErrorSound();
        break;
      case 'info':
        await soundService.playLoginSound();
        break;
      case 'warning':
      case 'custom':
      default:
        await soundService.playCustomSound();
        break;
    }
  }

  success(message: string, options: SoundToastOptions = {}) {
    const { playSound = true, soundType = 'success', ...toastOptions } = options;
    
    if (playSound) {
      this.playToastSound(soundType);
    }
    
    return toast.success(message, {
      duration: 4000,
      style: {
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      iconTheme: {
        primary: 'var(--accent-color)',
        secondary: 'var(--bg-primary)',
      },
      ...toastOptions,
    });
  }

  error(message: string, options: SoundToastOptions = {}) {
    const { playSound = true, soundType = 'error', ...toastOptions } = options;
    
    if (playSound) {
      this.playToastSound(soundType);
    }
    
    return toast.error(message, {
      duration: 5000,
      style: {
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: 'var(--bg-primary)',
      },
      ...toastOptions,
    });
  }

  info(message: string, options: SoundToastOptions = {}) {
    const { playSound = true, soundType = 'info', ...toastOptions } = options;
    
    if (playSound) {
      this.playToastSound(soundType);
    }
    
    return toast(message, {
      duration: 4000,
      icon: 'ℹ️',
      style: {
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--accent-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      ...toastOptions,
    });
  }

  warning(message: string, options: SoundToastOptions = {}) {
    const { playSound = true, soundType = 'warning', ...toastOptions } = options;
    
    if (playSound) {
      this.playToastSound(soundType);
    }
    
    return toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
      },
      ...toastOptions,
    });
  }

  connection(message: string, options: SoundToastOptions = {}) {
    const { playSound = true, soundType = 'connection', ...toastOptions } = options;
    
    if (playSound) {
      this.playToastSound(soundType);
    }
    
    return toast.success(message, {
      duration: 4000,
      icon: '🔗',
      style: {
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid #10b981',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
      },
      ...toastOptions,
    });
  }

  disconnection(message: string, options: SoundToastOptions = {}) {
    const { playSound = true, soundType = 'disconnection', ...toastOptions } = options;
    
    if (playSound) {
      this.playToastSound(soundType);
    }
    
    return toast.error(message, {
      duration: 4000,
      icon: '🔌',
      style: {
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
      },
      ...toastOptions,
    });
  }

  custom(message: string, options: SoundToastOptions = {}) {
    const { playSound = true, soundType = 'custom', ...toastOptions } = options;
    
    if (playSound) {
      this.playToastSound(soundType);
    }
    
    return toast(message, {
      duration: 4000,
      icon: '⚡',
      style: {
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--accent-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      ...toastOptions,
    });
  }

  // Method to disable sound for all toasts
  silent = {
    success: (message: string, options: ToastOptions = {}) => 
      this.success(message, { ...options, playSound: false }),
    error: (message: string, options: ToastOptions = {}) => 
      this.error(message, { ...options, playSound: false }),
    info: (message: string, options: ToastOptions = {}) => 
      this.info(message, { ...options, playSound: false }),
    warning: (message: string, options: ToastOptions = {}) => 
      this.warning(message, { ...options, playSound: false }),
    connection: (message: string, options: ToastOptions = {}) => 
      this.connection(message, { ...options, playSound: false }),
    disconnection: (message: string, options: ToastOptions = {}) => 
      this.disconnection(message, { ...options, playSound: false }),
    custom: (message: string, options: ToastOptions = {}) => 
      this.custom(message, { ...options, playSound: false }),
  };
}

export const toastService = new ToastService();
export default toastService;