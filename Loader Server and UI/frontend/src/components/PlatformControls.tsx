import React from 'react';
import { 
  FiTerminal, 
  FiMonitor, 
  FiDownload, 
  FiCpu, 
  FiShield, 
  FiLock, 
  FiDatabase,
  FiWifi,
  FiCamera,
  FiMic,
  FiSmartphone,
  FiSettings
} from 'react-icons/fi';
import { useNotification } from '../contexts/NotificationContext';

interface PlatformControlsProps {
  platform: 'windows' | 'mac' | 'android';
  features: {
    keylogger: boolean;
    screenCapture: boolean;
    fileManager: boolean;
    processManager: boolean;
    hvnc: boolean;
  };
  onExecuteCommand: (command: string, params?: any) => void;
}

const PlatformControls: React.FC<PlatformControlsProps> = ({ 
  platform, 
  features,
  onExecuteCommand
}) => {
  const { addNotification } = useNotification();
  // Common controls available on all platforms
  const commonControls = [
    {
      id: 'screenCapture',
      name: 'Screen Capture',
      icon: <FiMonitor className="w-6 h-6 mb-2" />,
      available: features.screenCapture,
      command: 'capture-screen'
    },
    {
      id: 'fileManager',
      name: 'File Manager',
      icon: <FiDownload className="w-6 h-6 mb-2" />,
      available: features.fileManager,
      command: 'file-manager'
    }
  ];

  // Windows-specific controls
  const windowsControls = [
    {
      id: 'keylogger',
      name: 'Keylogger',
      icon: <FiTerminal className="w-6 h-6 mb-2" />,
      available: features.keylogger,
      command: 'keylogger'
    },
    {
      id: 'processManager',
      name: 'Process Manager',
      icon: <FiCpu className="w-6 h-6 mb-2" />,
      available: features.processManager,
      command: 'process-manager'
    },
    {
      id: 'registry',
      name: 'Registry Editor',
      icon: <FiDatabase className="w-6 h-6 mb-2" />,
      available: true,
      command: 'registry-editor'
    },
    {
      id: 'uacBypass',
      name: 'UAC Bypass',
      icon: <FiShield className="w-6 h-6 mb-2" />,
      available: true,
      command: 'uac-bypass'
    }
  ];

  // macOS-specific controls
  const macControls = [
    {
      id: 'keylogger',
      name: 'Keylogger',
      icon: <FiTerminal className="w-6 h-6 mb-2" />,
      available: features.keylogger,
      command: 'keylogger'
    },
    {
      id: 'processManager',
      name: 'Process Manager',
      icon: <FiCpu className="w-6 h-6 mb-2" />,
      available: features.processManager,
      command: 'process-manager'
    },
    {
      id: 'webcam',
      name: 'Webcam Capture',
      icon: <FiCamera className="w-6 h-6 mb-2" />,
      available: true,
      command: 'webcam-capture'
    },
    {
      id: 'microphone',
      name: 'Microphone',
      icon: <FiMic className="w-6 h-6 mb-2" />,
      available: true,
      command: 'microphone-capture'
    }
  ];

  // Android-specific controls
  const androidControls = [
    {
      id: 'sms',
      name: 'SMS Manager',
      icon: <FiSmartphone className="w-6 h-6 mb-2" />,
      available: true,
      command: 'sms-manager'
    },
    {
      id: 'contacts',
      name: 'Contacts',
      icon: <FiDownload className="w-6 h-6 mb-2" />,
      available: true,
      command: 'contacts-manager'
    },
    {
      id: 'location',
      name: 'Location',
      icon: <FiWifi className="w-6 h-6 mb-2" />,
      available: true,
      command: 'location-tracker'
    },
    {
      id: 'appManager',
      name: 'App Manager',
      icon: <FiSettings className="w-6 h-6 mb-2" />,
      available: true,
      command: 'app-manager'
    }
  ];

  // Determine which controls to show based on platform
  const getPlatformControls = () => {
    switch (platform) {
      case 'windows':
        return [...commonControls, ...windowsControls];
      case 'mac':
        return [...commonControls, ...macControls];
      case 'android':
        return [...commonControls, ...androidControls];
      default:
        return commonControls;
    }
  };

  const handleControlClick = (control: any) => {
    if (control.available) {
      onExecuteCommand(control.command);
      addNotification('info', `Executing ${control.name}...`);
    }
  };

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        {platform === 'windows' ? 'Windows' : platform === 'mac' ? 'macOS' : 'Android'} Controls
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {getPlatformControls().map((control) => (
          <button 
            key={control.id}
            className={`p-3 rounded-lg border flex flex-col items-center justify-center hover:bg-primary/10 ${
              !control.available ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!control.available}
            onClick={() => handleControlClick(control)}
          >
            {control.icon}
            <span>{control.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlatformControls;