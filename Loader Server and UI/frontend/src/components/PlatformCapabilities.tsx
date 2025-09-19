import React from 'react';
import { 
  FiMonitor, 
  FiFolder, 
  FiTerminal, 
  FiSettings,
  FiShield,
  FiWifi,
  FiCamera,
  FiMic,
  FiMapPin,
  FiSmartphone,
  FiHardDrive,
  FiCpu,
  FiMemoryStick
} from 'react-icons/fi';
import { 
  SiWindows, 
  SiApple, 
  SiAndroid, 
  SiLinux 
} from 'react-icons/si';

interface PlatformCapabilitiesProps {
  platform: string;
  className?: string;
}

interface Capability {
  name: string;
  icon: React.ReactNode;
  available: boolean;
  description: string;
  category: 'system' | 'remote' | 'security' | 'mobile' | 'special';
}

const PlatformCapabilities: React.FC<PlatformCapabilitiesProps> = ({ 
  platform, 
  className = '' 
}) => {
  const getPlatformIcon = (platform: string) => {
    const iconClass = "w-6 h-6";
    switch (platform.toLowerCase()) {
      case 'windows':
        return <SiWindows className={`${iconClass} text-blue-500`} />;
      case 'mac':
      case 'macos':
        return <SiApple className={`${iconClass} text-gray-600`} />;
      case 'android':
        return <SiAndroid className={`${iconClass} text-green-500`} />;
      case 'linux':
        return <SiLinux className={`${iconClass} text-orange-500`} />;
      default:
        return <FiMonitor className={`${iconClass} text-gray-500`} />;
    }
  };

  const getCapabilities = (platform: string): Capability[] => {
    const baseCapabilities: Capability[] = [
      {
        name: 'Remote Desktop',
        icon: <FiMonitor className="w-5 h-5" />,
        available: true,
        description: 'Full desktop access and control',
        category: 'remote'
      },
      {
        name: 'File System',
        icon: <FiFolder className="w-5 h-5" />,
        available: true,
        description: 'Browse and transfer files',
        category: 'system'
      },
      {
        name: 'Shell Access',
        icon: <FiTerminal className="w-5 h-5" />,
        available: true,
        description: 'Command line interface',
        category: 'system'
      },
      {
        name: 'System Info',
        icon: <FiCpu className="w-5 h-5" />,
        available: true,
        description: 'Hardware and system information',
        category: 'system'
      }
    ];

    switch (platform.toLowerCase()) {
      case 'windows':
        return [
          ...baseCapabilities,
          {
            name: 'Registry Editor',
            icon: <FiSettings className="w-5 h-5" />,
            available: true,
            description: 'Windows registry access',
            category: 'special'
          },
          {
            name: 'Service Manager',
            icon: <FiSettings className="w-5 h-5" />,
            available: true,
            description: 'Windows services control',
            category: 'special'
          },
          {
            name: 'UAC Bypass',
            icon: <FiShield className="w-5 h-5" />,
            available: true,
            description: 'Privilege escalation',
            category: 'security'
          },
          {
            name: 'Process Injection',
            icon: <FiMemoryStick className="w-5 h-5" />,
            available: true,
            description: 'Advanced process manipulation',
            category: 'security'
          }
        ];

      case 'mac':
      case 'macos':
        return [
          ...baseCapabilities,
          {
            name: 'Keychain Access',
            icon: <FiShield className="w-5 h-5" />,
            available: true,
            description: 'macOS keychain management',
            category: 'security'
          },
          {
            name: 'LaunchAgent',
            icon: <FiSettings className="w-5 h-5" />,
            available: true,
            description: 'macOS launch services',
            category: 'special'
          },
          {
            name: 'Accessibility',
            icon: <FiSettings className="w-5 h-5" />,
            available: true,
            description: 'Accessibility permissions',
            category: 'security'
          }
        ];

      case 'android':
        return [
          {
            name: 'Screen Mirror',
            icon: <FiMonitor className="w-5 h-5" />,
            available: true,
            description: 'Real-time screen mirroring',
            category: 'remote'
          },
          {
            name: 'File Manager',
            icon: <FiFolder className="w-5 h-5" />,
            available: true,
            description: 'Android file system access',
            category: 'system'
          },
          {
            name: 'Shell (ADB)',
            icon: <FiTerminal className="w-5 h-5" />,
            available: true,
            description: 'Android Debug Bridge shell',
            category: 'system'
          },
          {
            name: 'Camera Access',
            icon: <FiCamera className="w-5 h-5" />,
            available: true,
            description: 'Front/rear camera control',
            category: 'mobile'
          },
          {
            name: 'Microphone',
            icon: <FiMic className="w-5 h-5" />,
            available: true,
            description: 'Audio recording capability',
            category: 'mobile'
          },
          {
            name: 'Location',
            icon: <FiMapPin className="w-5 h-5" />,
            available: true,
            description: 'GPS location tracking',
            category: 'mobile'
          },
          {
            name: 'SMS/Calls',
            icon: <FiSmartphone className="w-5 h-5" />,
            available: true,
            description: 'SMS and call management',
            category: 'mobile'
          },
          {
            name: 'App Manager',
            icon: <FiSettings className="w-5 h-5" />,
            available: true,
            description: 'Install/uninstall apps',
            category: 'special'
          }
        ];

      case 'linux':
        return [
          ...baseCapabilities,
          {
            name: 'Package Manager',
            icon: <FiSettings className="w-5 h-5" />,
            available: true,
            description: 'System package management',
            category: 'special'
          },
          {
            name: 'Systemd Services',
            icon: <FiSettings className="w-5 h-5" />,
            available: true,
            description: 'Service management',
            category: 'special'
          },
          {
            name: 'Root Access',
            icon: <FiShield className="w-5 h-5" />,
            available: true,
            description: 'Privilege escalation',
            category: 'security'
          }
        ];

      default:
        return baseCapabilities;
    }
  };

  const capabilities = getCapabilities(platform);
  const categorizedCapabilities = capabilities.reduce((acc, capability) => {
    if (!acc[capability.category]) {
      acc[capability.category] = [];
    }
    acc[capability.category].push(capability);
    return acc;
  }, {} as Record<string, Capability[]>);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'remote':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'security':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'mobile':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'special':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'system':
        return 'System Access';
      case 'remote':
        return 'Remote Control';
      case 'security':
        return 'Security Features';
      case 'mobile':
        return 'Mobile Features';
      case 'special':
        return 'Platform Specific';
      default:
        return 'Other';
    }
  };

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center mb-6">
        {getPlatformIcon(platform)}
        <div className="ml-3">
          <h3 className="text-lg font-semibold">
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Capabilities
          </h3>
          <p className="text-sm text-bodydark2">
            Available features for this platform
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(categorizedCapabilities).map(([category, caps]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-bodydark mb-3">
              {getCategoryTitle(category)}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {caps.map((capability, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getCategoryColor(category)} ${
                    capability.available 
                      ? 'opacity-100' 
                      : 'opacity-50 grayscale'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      {capability.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-bodydark">
                          {capability.name}
                        </h5>
                        {capability.available && (
                          <span className="inline-block w-2 h-2 bg-success rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-bodydark2 mt-1">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-stroke dark:border-strokedark">
        <div className="flex items-center justify-between text-sm">
          <span className="text-bodydark2">
            Total Capabilities: {capabilities.length}
          </span>
          <span className="text-bodydark2">
            Available: {capabilities.filter(c => c.available).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlatformCapabilities;