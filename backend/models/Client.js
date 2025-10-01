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
    // Client identity and deduplication
    machineFingerprint: {
        type: String,
        unique: true,
        sparse: true, // Allow null values for existing records
    },
    firstSeen: {
        type: Date,
        default: Date.now,
    },
    connectedAt: {
        type: Date,
    },
    disconnectedAt: {
        type: Date,
    },
    uptimeSeconds: {
        type: Number,
        default: 0,
    },
    bootTime: {
        type: Date,
    },
    // Command metrics
    commandSuccess: {
        type: Number,
        default: 0,
    },
    commandFailed: {
        type: Number,
        default: 0,
    },
    avgLatencyMs: {
        type: Number,
        default: 0,
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

// Add indexes for performance and uniqueness
clientSchema.index({ uuid: 1 }, { unique: true });
clientSchema.index({ machineFingerprint: 1 }, { unique: true, sparse: true });
clientSchema.index({ status: 1, lastHeartbeat: -1 });
clientSchema.index({ machineFingerprint: 1, uuid: 1 });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;