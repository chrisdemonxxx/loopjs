import { ThemeMode } from '../contexts/ThemeContext';

export type SoundEvent = 'connection' | 'disconnection' | 'custom' | 'login' | 'error' | 'success';

interface ThemeSounds {
  connection: string;
  disconnection: string;
  custom: string;
  login: string;
  error: string;
  success: string;
}

// Sound frequencies and patterns for different themes
const themeSoundConfigs: Record<ThemeMode, ThemeSounds> = {
  light: {
    connection: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    disconnection: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    custom: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    login: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
  },
  dark: {
    connection: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    disconnection: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    custom: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    login: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
  },
  system: {
    connection: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    disconnection: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    custom: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    login: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
  },
  hacker: {
    connection: 'hacker-connect',
    disconnection: 'hacker-disconnect',
    custom: 'hacker-custom',
    login: 'hacker-login',
    error: 'hacker-error',
    success: 'hacker-success'
  },
  matrix: {
    connection: 'matrix-connect',
    disconnection: 'matrix-disconnect',
    custom: 'matrix-custom',
    login: 'matrix-login',
    error: 'matrix-error',
    success: 'matrix-success'
  },
  cyberpunk: {
    connection: 'cyberpunk-connect',
    disconnection: 'cyberpunk-disconnect',
    custom: 'cyberpunk-custom',
    login: 'cyberpunk-login',
    error: 'cyberpunk-error',
    success: 'cyberpunk-success'
  },
  redteam: {
    connection: 'redteam-connect',
    disconnection: 'redteam-disconnect',
    custom: 'redteam-custom',
    login: 'redteam-login',
    error: 'redteam-error',
    success: 'redteam-success'
  },
  'neon-city': {
    connection: 'neon-connect',
    disconnection: 'neon-disconnect',
    custom: 'neon-custom',
    login: 'neon-login',
    error: 'neon-error',
    success: 'neon-success'
  },
  'ghost-protocol': {
    connection: 'ghost-connect',
    disconnection: 'ghost-disconnect',
    custom: 'ghost-custom',
    login: 'ghost-login',
    error: 'ghost-error',
    success: 'ghost-success'
  },
  quantum: {
    connection: 'quantum-connect',
    disconnection: 'quantum-disconnect',
    custom: 'quantum-custom',
    login: 'quantum-login',
    error: 'quantum-error',
    success: 'quantum-success'
  },
  'neural-net': {
    connection: 'neural-connect',
    disconnection: 'neural-disconnect',
    custom: 'neural-custom',
    login: 'neural-login',
    error: 'neural-error',
    success: 'neural-success'
  },
  'dark-web': {
    connection: 'darkweb-connect',
    disconnection: 'darkweb-disconnect',
    custom: 'darkweb-custom',
    login: 'darkweb-login',
    error: 'darkweb-error',
    success: 'darkweb-success'
  },
  glass: {
    connection: 'glass-connect',
    disconnection: 'glass-disconnect',
    custom: 'glass-custom',
    login: 'glass-login',
    error: 'glass-error',
    success: 'glass-success'
  },
  hologram: {
    connection: 'hologram-connect',
    disconnection: 'hologram-disconnect',
    custom: 'hologram-custom',
    login: 'hologram-login',
    error: 'hologram-error',
    success: 'hologram-success'
  }
};

class SoundService {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.7;
  private currentTheme: ThemeMode = 'hacker';
  private audioCache: Map<string, AudioBuffer> = new Map();

  constructor() {
    // Initialize AudioContext on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext not supported:', error);
      }
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
      }
    }
  }

  setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
      }

      // Apply envelope (fade in/out)
      const envelope = Math.min(1, Math.min(i / (sampleRate * 0.01), (length - i) / (sampleRate * 0.01)));
      data[i] = sample * envelope * this.volume;
    }

    return buffer;
  }

  private generateThemeSound(event: SoundEvent): AudioBuffer | null {
    if (!this.audioContext) return null;

    const themeConfig = themeSoundConfigs[this.currentTheme];
    const soundKey = `${this.currentTheme}-${event}`;

    // Check cache first
    if (this.audioCache.has(soundKey)) {
      return this.audioCache.get(soundKey)!;
    }

    let buffer: AudioBuffer | null = null;

    switch (this.currentTheme) {
      case 'hacker':
      case 'matrix':
        buffer = this.generateHackerSound(event);
        break;
      case 'cyberpunk':
        buffer = this.generateCyberpunkSound(event);
        break;
      case 'redteam':
        buffer = this.generateRedTeamSound(event);
        break;
      case 'neon-city':
        buffer = this.generateNeonSound(event);
        break;
      case 'ghost-protocol':
        buffer = this.generateGhostSound(event);
        break;
      case 'quantum':
        buffer = this.generateQuantumSound(event);
        break;
      case 'neural-net':
        buffer = this.generateNeuralSound(event);
        break;
      case 'dark-web':
        buffer = this.generateDarkWebSound(event);
        break;
      case 'glass':
        buffer = this.generateGlassSound(event);
        break;
      case 'hologram':
        buffer = this.generateHologramSound(event);
        break;
      default:
        buffer = this.generateDefaultSound(event);
    }

    if (buffer) {
      this.audioCache.set(soundKey, buffer);
    }

    return buffer;
  }

  private generateHackerSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(800, 0.2, 'square');
      case 'disconnection':
        return this.generateTone(400, 0.3, 'square');
      case 'custom':
        return this.generateTone(1000, 0.15, 'sawtooth');
      case 'login':
        return this.generateSequence([600, 800, 1000], [0.1, 0.1, 0.2], 'square');
      case 'error':
        return this.generateTone(200, 0.5, 'square');
      case 'success':
        return this.generateSequence([800, 1200], [0.1, 0.2], 'sine');
      default:
        return this.generateTone(600, 0.2, 'sine');
    }
  }

  private generateCyberpunkSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(1200, 0.25, 'sawtooth');
      case 'disconnection':
        return this.generateTone(300, 0.4, 'triangle');
      case 'custom':
        return this.generateSequence([1500, 1000, 1500], [0.1, 0.1, 0.1], 'sawtooth');
      case 'login':
        return this.generateSequence([800, 1200, 1600], [0.15, 0.15, 0.2], 'sawtooth');
      case 'error':
        return this.generateTone(150, 0.6, 'square');
      case 'success':
        return this.generateSequence([1000, 1500, 2000], [0.1, 0.1, 0.2], 'sine');
      default:
        return this.generateTone(1000, 0.2, 'sawtooth');
    }
  }

  private generateRedTeamSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(600, 0.3, 'triangle');
      case 'disconnection':
        return this.generateTone(250, 0.5, 'square');
      case 'custom':
        return this.generateTone(900, 0.2, 'sawtooth');
      case 'login':
        return this.generateSequence([400, 600, 800], [0.2, 0.2, 0.3], 'triangle');
      case 'error':
        return this.generateTone(100, 0.8, 'square');
      case 'success':
        return this.generateSequence([600, 900], [0.2, 0.3], 'sine');
      default:
        return this.generateTone(500, 0.3, 'triangle');
    }
  }

  private generateNeonSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(1500, 0.2, 'sine');
      case 'disconnection':
        return this.generateTone(500, 0.3, 'triangle');
      case 'custom':
        return this.generateSequence([1800, 1200], [0.1, 0.15], 'sine');
      case 'login':
        return this.generateSequence([1000, 1500, 2000, 2500], [0.1, 0.1, 0.1, 0.2], 'sine');
      case 'error':
        return this.generateTone(200, 0.4, 'sawtooth');
      case 'success':
        return this.generateSequence([1500, 2000, 2500], [0.1, 0.1, 0.2], 'sine');
      default:
        return this.generateTone(1200, 0.2, 'sine');
    }
  }

  private generateGhostSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(400, 0.4, 'triangle');
      case 'disconnection':
        return this.generateTone(200, 0.6, 'sine');
      case 'custom':
        return this.generateTone(600, 0.3, 'triangle');
      case 'login':
        return this.generateSequence([300, 400, 500], [0.2, 0.2, 0.3], 'sine');
      case 'error':
        return this.generateTone(150, 0.7, 'triangle');
      case 'success':
        return this.generateSequence([400, 600], [0.2, 0.4], 'sine');
      default:
        return this.generateTone(350, 0.4, 'sine');
    }
  }

  private generateQuantumSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateSequence([800, 1600], [0.1, 0.2], 'sine');
      case 'disconnection':
        return this.generateSequence([1600, 800], [0.1, 0.2], 'sine');
      case 'custom':
        return this.generateSequence([1000, 2000, 1000], [0.1, 0.1, 0.1], 'sine');
      case 'login':
        return this.generateSequence([500, 1000, 1500, 2000], [0.1, 0.1, 0.1, 0.2], 'sine');
      case 'error':
        return this.generateTone(300, 0.5, 'triangle');
      case 'success':
        return this.generateSequence([1000, 1500, 2000, 2500], [0.08, 0.08, 0.08, 0.16], 'sine');
      default:
        return this.generateTone(1200, 0.2, 'sine');
    }
  }

  private generateNeuralSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(700, 0.25, 'sawtooth');
      case 'disconnection':
        return this.generateTone(350, 0.35, 'triangle');
      case 'custom':
        return this.generateSequence([700, 1400], [0.12, 0.18], 'sawtooth');
      case 'login':
        return this.generateSequence([500, 700, 1000, 1400], [0.1, 0.1, 0.1, 0.2], 'sawtooth');
      case 'error':
        return this.generateTone(175, 0.6, 'square');
      case 'success':
        return this.generateSequence([700, 1000, 1400], [0.1, 0.1, 0.2], 'sine');
      default:
        return this.generateTone(850, 0.2, 'sawtooth');
    }
  }

  private generateDarkWebSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(450, 0.35, 'square');
      case 'disconnection':
        return this.generateTone(225, 0.45, 'triangle');
      case 'custom':
        return this.generateTone(675, 0.25, 'sawtooth');
      case 'login':
        return this.generateSequence([300, 450, 600], [0.15, 0.15, 0.25], 'square');
      case 'error':
        return this.generateTone(125, 0.8, 'square');
      case 'success':
        return this.generateSequence([450, 675], [0.2, 0.3], 'sine');
      default:
        return this.generateTone(400, 0.3, 'square');
    }
  }

  private generateGlassSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(1000, 0.2, 'sine');
      case 'disconnection':
        return this.generateTone(500, 0.3, 'sine');
      case 'custom':
        return this.generateTone(1500, 0.15, 'sine');
      case 'login':
        return this.generateSequence([800, 1200, 1600], [0.1, 0.1, 0.2], 'sine');
      case 'error':
        return this.generateTone(300, 0.4, 'triangle');
      case 'success':
        return this.generateSequence([1000, 1500], [0.15, 0.25], 'sine');
      default:
        return this.generateTone(1200, 0.2, 'sine');
    }
  }

  private generateHologramSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateSequence([1200, 2400], [0.1, 0.15], 'sine');
      case 'disconnection':
        return this.generateSequence([2400, 1200], [0.1, 0.15], 'sine');
      case 'custom':
        return this.generateSequence([1800, 3600, 1800], [0.08, 0.08, 0.08], 'sine');
      case 'login':
        return this.generateSequence([600, 1200, 1800, 2400], [0.08, 0.08, 0.08, 0.16], 'sine');
      case 'error':
        return this.generateTone(400, 0.4, 'triangle');
      case 'success':
        return this.generateSequence([1200, 1800, 2400, 3000], [0.06, 0.06, 0.06, 0.12], 'sine');
      default:
        return this.generateTone(1800, 0.15, 'sine');
    }
  }

  private generateDefaultSound(event: SoundEvent): AudioBuffer | null {
    switch (event) {
      case 'connection':
        return this.generateTone(800, 0.2, 'sine');
      case 'disconnection':
        return this.generateTone(400, 0.3, 'sine');
      case 'custom':
        return this.generateTone(1000, 0.15, 'sine');
      case 'login':
        return this.generateSequence([600, 800, 1000], [0.1, 0.1, 0.2], 'sine');
      case 'error':
        return this.generateTone(300, 0.4, 'triangle');
      case 'success':
        return this.generateSequence([800, 1200], [0.15, 0.25], 'sine');
      default:
        return this.generateTone(600, 0.2, 'sine');
    }
  }

  private generateSequence(frequencies: number[], durations: number[], type: OscillatorType = 'sine'): AudioBuffer | null {
    if (!this.audioContext || frequencies.length !== durations.length) return null;

    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const sampleRate = this.audioContext.sampleRate;
    const totalLength = Math.floor(sampleRate * totalDuration);
    const buffer = this.audioContext.createBuffer(1, totalLength, sampleRate);
    const data = buffer.getChannelData(0);

    let currentSample = 0;

    for (let i = 0; i < frequencies.length; i++) {
      const frequency = frequencies[i];
      const duration = durations[i];
      const length = Math.floor(sampleRate * duration);

      for (let j = 0; j < length && currentSample < totalLength; j++, currentSample++) {
        const t = j / sampleRate;
        let sample = 0;

        switch (type) {
          case 'sine':
            sample = Math.sin(2 * Math.PI * frequency * t);
            break;
          case 'square':
            sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
            break;
          case 'sawtooth':
            sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
            break;
          case 'triangle':
            sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
            break;
        }

        // Apply envelope
        const envelope = Math.min(1, Math.min(j / (sampleRate * 0.01), (length - j) / (sampleRate * 0.01)));
        data[currentSample] = sample * envelope * this.volume;
      }
    }

    return buffer;
  }

  async playSound(event: SoundEvent): Promise<void> {
    // DISABLED FOR TESTING - All sounds disabled
    return;
    
    if (!this.soundEnabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = this.generateThemeSound(event);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Convenience methods for specific events
  async playConnectionSound(): Promise<void> {
    return this.playSound('connection');
  }

  async playDisconnectionSound(): Promise<void> {
    return this.playSound('disconnection');
  }

  async playCustomSound(): Promise<void> {
    return this.playSound('custom');
  }

  async playLoginSound(): Promise<void> {
    return this.playSound('login');
  }

  async playErrorSound(): Promise<void> {
    return this.playSound('error');
  }

  async playSuccessSound(): Promise<void> {
    return this.playSound('success');
  }
}

// Create singleton instance
export const soundService = new SoundService();
export default soundService;