import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

export default class UbiiComponentProximity {
  constructor(deviceName) {
    this.deviceName = deviceName;
    this.topic = `/${deviceName}/proximity`;
    this.isActive = false;
    this.lastCheck = null;
    this.checkCount = 0;
    this.proximityResults = [];
  }

  getUbiiSpecs() {
    return {
      name: 'proximity-checker',
      tags: ['proximity', 'security'],
      deviceType: 'PARTICIPANT',
      components: [],
      description: 'Proximity-based access control component'
    };
  }

  async register() {
    // Get the device ID from the client service
    const clientId = UbiiClientService.instance.getClientID();
    if (!clientId) {
      console.error('Client not registered. Cannot register proximity component.');
      return false;
    }

    console.log('Proximity component registered successfully');
    return true;
  }

  async checkProximity(targetDeviceId, maxDistance = 100) {
    const clientId = UbiiClientService.instance.getClientID();
    if (!clientId) {
      console.error('Client not registered. Cannot check proximity.');
      return null;
    }

    try {
      const response = await UbiiClientService.instance.callService({
        topic: '/services/location/proximity',
        device: {
          sourceDeviceId: clientId,
          targetDeviceId: targetDeviceId,
          maxDistance: maxDistance
        }
      });

      this.checkCount++;
      this.lastCheck = new Date();

      if (response.success) {
        const result = {
          timestamp: this.lastCheck.toISOString(),
          sourceDeviceId: clientId,
          targetDeviceId: targetDeviceId,
          distance: response.success.data.distance,
          maxDistance: response.success.data.maxDistance,
          isWithinProximity: response.success.data.isWithinProximity,
          sourceLocation: response.success.data.sourceLocation,
          targetLocation: response.success.data.targetLocation
        };

        this.proximityResults.push(result);

        console.log(`Proximity Check #${this.checkCount}:`, {
          sourceDevice: clientId,
          targetDevice: targetDeviceId,
          distance: `${result.distance}m`,
          maxDistance: `${result.maxDistance}m`,
          allowed: result.isWithinProximity ? '✅ YES' : '❌ NO'
        });

        return result;
      } else {
        console.error('Proximity check failed:', response.error.message);
        return null;
      }
    } catch (error) {
      console.error('Error checking proximity:', error);
      return null;
    }
  }

  async checkMultipleDevices(deviceIds, maxDistance = 100) {
    const results = [];
    
    for (const deviceId of deviceIds) {
      const result = await this.checkProximity(deviceId, maxDistance);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  getProximityStatus() {
    return {
      isActive: this.isActive,
      checkCount: this.checkCount,
      lastCheck: this.lastCheck,
      recentResults: this.proximityResults.slice(-5) // Last 5 results
    };
  }

  // Calculate distance between two points using Haversine formula (client-side)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance * 1000; // Convert to meters
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Get devices within proximity
  getDevicesWithinProximity(results, maxDistance = 100) {
    return results.filter(result => result.isWithinProximity);
  }

  // Get devices outside proximity
  getDevicesOutsideProximity(results, maxDistance = 100) {
    return results.filter(result => !result.isWithinProximity);
  }

  // Clear proximity history
  clearHistory() {
    this.proximityResults = [];
    this.checkCount = 0;
    this.lastCheck = null;
  }
} 