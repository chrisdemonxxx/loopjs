const axios = require('axios');

class GeoLocationService {
  constructor() {
    // Using multiple free IP geolocation services for reliability
    this.services = [
      {
        name: 'ipapi',
        url: 'http://ip-api.com/json/',
        fields: 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query',
        parser: this.parseIpApi.bind(this)
      },
      {
        name: 'ipinfo',
        url: 'https://ipinfo.io/',
        parser: this.parseIpInfo.bind(this)
      }
    ];
  }

  /**
   * Get comprehensive location information for an IP address
   * @param {string} ip - IP address to lookup
   * @returns {Promise<Object>} Location information
   */
  async getLocationInfo(ip) {
    // Skip private/local IPs
    if (this.isPrivateIP(ip)) {
      return {
        ip: ip,
        country: 'Local Network',
        countryCode: 'LAN',
        region: 'Private',
        regionName: 'Local Area Network',
        city: 'Local',
        zip: 'N/A',
        latitude: null,
        longitude: null,
        timezone: 'Local',
        isp: 'Local Network',
        organization: 'Private Network',
        asn: 'N/A',
        isPrivate: true
      };
    }

    // Try each service until one succeeds
    for (const service of this.services) {
      try {
        const locationInfo = await this.fetchFromService(service, ip);
        if (locationInfo && locationInfo.country) {
          return locationInfo;
        }
      } catch (error) {
        console.warn(`Geolocation service ${service.name} failed:`, error.message);
      }
    }

    // Fallback if all services fail
    return {
      ip: ip,
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      regionName: 'Unknown',
      city: 'Unknown',
      zip: 'Unknown',
      latitude: null,
      longitude: null,
      timezone: 'Unknown',
      isp: 'Unknown',
      organization: 'Unknown',
      asn: 'Unknown',
      isPrivate: false
    };
  }

  /**
   * Fetch location data from a specific service
   * @param {Object} service - Service configuration
   * @param {string} ip - IP address
   * @returns {Promise<Object>} Parsed location data
   */
  async fetchFromService(service, ip) {
    const url = service.name === 'ipapi' 
      ? `${service.url}${ip}?fields=${service.fields}`
      : `${service.url}${ip}/json`;

    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'LoopJS-RedTeam-Loader/1.0'
      }
    });

    return service.parser(response.data, ip);
  }

  /**
   * Parse IP-API response
   * @param {Object} data - API response
   * @param {string} ip - Original IP
   * @returns {Object} Standardized location info
   */
  parseIpApi(data, ip) {
    if (data.status === 'fail') {
      throw new Error(data.message || 'IP-API lookup failed');
    }

    return {
      ip: ip,
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      region: data.region || 'Unknown',
      regionName: data.regionName || 'Unknown',
      city: data.city || 'Unknown',
      zip: data.zip || 'Unknown',
      latitude: data.lat || null,
      longitude: data.lon || null,
      timezone: data.timezone || 'Unknown',
      isp: data.isp || 'Unknown',
      organization: data.org || 'Unknown',
      asn: data.as || 'Unknown',
      isPrivate: false
    };
  }

  /**
   * Parse IPInfo response
   * @param {Object} data - API response
   * @param {string} ip - Original IP
   * @returns {Object} Standardized location info
   */
  parseIpInfo(data, ip) {
    const [city, region] = (data.city || 'Unknown,Unknown').split(',');
    const [lat, lon] = (data.loc || ',').split(',');

    return {
      ip: ip,
      country: data.country || 'Unknown',
      countryCode: data.country || 'XX',
      region: region?.trim() || 'Unknown',
      regionName: region?.trim() || 'Unknown',
      city: city?.trim() || 'Unknown',
      zip: data.postal || 'Unknown',
      latitude: lat ? parseFloat(lat) : null,
      longitude: lon ? parseFloat(lon) : null,
      timezone: data.timezone || 'Unknown',
      isp: data.org || 'Unknown',
      organization: data.org || 'Unknown',
      asn: 'Unknown',
      isPrivate: false
    };
  }

  /**
   * Check if IP is private/local
   * @param {string} ip - IP address to check
   * @returns {boolean} True if private IP
   */
  isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/,
      /^fc00:/,
      /^fd00:/
    ];

    return privateRanges.some(range => range.test(ip)) || 
           ip === 'localhost' || 
           ip === '::1' ||
           ip.startsWith('::ffff:127.') ||
           ip.startsWith('::ffff:10.') ||
           ip.startsWith('::ffff:172.') ||
           ip.startsWith('::ffff:192.168.');
  }

  /**
   * Format location for display
   * @param {Object} locationInfo - Location information
   * @returns {string} Formatted location string
   */
  formatLocation(locationInfo) {
    if (locationInfo.isPrivate) {
      return '🏠 Local Network';
    }

    const parts = [];
    
    if (locationInfo.city && locationInfo.city !== 'Unknown') {
      parts.push(locationInfo.city);
    }
    
    if (locationInfo.regionName && locationInfo.regionName !== 'Unknown' && locationInfo.regionName !== locationInfo.city) {
      parts.push(locationInfo.regionName);
    }
    
    if (locationInfo.country && locationInfo.country !== 'Unknown') {
      parts.push(locationInfo.country);
    }

    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }

  /**
   * Get flag emoji for country code
   * @param {string} countryCode - ISO country code
   * @returns {string} Flag emoji
   */
  getFlagEmoji(countryCode) {
    if (!countryCode || countryCode === 'XX' || countryCode === 'LAN') {
      return '🌍';
    }

    // Convert country code to flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  }
}

// Create singleton instance
const geoLocationService = new GeoLocationService();

module.exports = geoLocationService;