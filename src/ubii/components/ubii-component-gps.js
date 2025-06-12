import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { proto } from '@tum-far/ubii-msg-formats';

export default class UbiiComponentGPS {
  constructor(deviceName) {
    this.name = deviceName + '_GPS';
    this.topic = `/${deviceName}/gps_coordinates`;
    this.tags = ['gps', 'location'];
    this.watchId = null;
    this.lastUpdate = null;
    this.updateCount = 0;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.deviceId = null;
    this.isSecure = window.location.protocol === 'https:';
  }

  getUbiiSpecs() {
    return {
      name: this.name,
      topic: this.topic,
      tags: this.tags,
      messageFormat: 'ubii.dataStructure.Vector2',
      ioType: proto.ubii.devices.Component.IOType.PUBLISHER
    };
  }

  async register() {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation is not supported by this browser');
      return false;
    }

    // Check if we're on iOS and not using HTTPS
    if (this.isIOS && !this.isSecure) {
      console.warn('iOS requires HTTPS for geolocation to work properly. Current protocol:', window.location.protocol);
      // We'll still try to register, but warn the user
    }

    // Check current permission status
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      console.log('Initial geolocation permission status:', permissionStatus.state);
      
      if (permissionStatus.state === 'denied') {
        console.warn('Geolocation permission is denied');
        return false;
      }
    } catch (error) {
      console.warn('Could not check geolocation permission status:', error);
      // Continue anyway, as the permission might still be granted
    }

    // Get the device ID from the client service
    const clientId = UbiiClientService.instance.getClientID();
    if (!clientId) {
      console.error('Client not registered. Cannot register GPS component.');
      return false;
    }

    console.log('GPS component registered successfully');
    return true;
  }

  async start() {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    console.log('Starting GPS tracking...');

    // For iOS, we first try to get a single position to trigger the permission prompt
    if (this.isIOS) {
      try {
        if (!this.isSecure) {
          console.warn('Running on HTTP - geolocation may not work on iOS. Please use HTTPS.');
        }
        
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Initial position obtained:', position);
              resolve(position);
            },
            (error) => {
              console.error('Initial position error:', error);
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });
      } catch (error) {
        console.error('Failed to get initial position:', error);
        // Continue anyway, as the watchPosition might still work
      }
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.updateCount++;
        this.lastUpdate = new Date();
        
        // Log detailed position information
        console.log(`GPS Update #${this.updateCount}:`, {
          timestamp: this.lastUpdate.toISOString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          isIOS: this.isIOS,
          protocol: window.location.protocol
        });

        // Publish coordinates as vector2
        UbiiClientService.instance.publishRecord({
          topic: this.topic,
          vector2: {
            x: position.coords.latitude,
            y: position.coords.longitude
          }
        });

        // Update device location
        const clientId = UbiiClientService.instance.getClientID();
        if (clientId) {
          // Call the location update service
          UbiiClientService.instance.callService({
            topic: '/ubii/services/location/update',
            device: {
              id: clientId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              location_accuracy: position.coords.accuracy
            }
          }).then(response => {
            if (response.success) {
              console.log('Device location updated successfully:', response.success.message);
            } else if (response.error) {
              console.error('Failed to update device location:', response.error.message);
            }
          }).catch(error => {
            console.error('Error updating device location:', error);
          });
        }
      },
      (error) => {
        // Enhanced error logging
        const errorMessages = {
          1: 'PERMISSION_DENIED - User denied the request for Geolocation',
          2: 'POSITION_UNAVAILABLE - Location information is unavailable',
          3: 'TIMEOUT - The request to get user location timed out'
        };
        
        console.error('GPS Error:', {
          code: error.code,
          message: errorMessages[error.code] || error.message,
          timestamp: new Date().toISOString(),
          isIOS: this.isIOS,
          protocol: window.location.protocol
        });

        // If permission denied, try to request permission explicitly
        if (error.code === 1) {
          console.log('Attempting to request location permission...');
          if (this.isIOS) {
            console.log('iOS detected - please ensure location services are enabled in Settings > Privacy > Location Services');
            if (!this.isSecure) {
              console.warn('Running on HTTP - geolocation may not work on iOS. Please use HTTPS.');
            }
          }
          navigator.permissions.query({ name: 'geolocation' })
            .then(permissionStatus => {
              console.log('Geolocation permission status:', permissionStatus.state);
              if (permissionStatus.state === 'prompt') {
                // Permission hasn't been granted or denied yet
                console.log('Requesting location permission...');
                navigator.geolocation.getCurrentPosition(
                  () => console.log('Location permission granted'),
                  () => console.log('Location permission denied'),
                  { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                  }
                );
              }
            })
            .catch(err => console.error('Error checking geolocation permission:', err));
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    console.log('GPS tracking started with watchId:', this.watchId);
  }

  async stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      console.log('GPS tracking stopped. Final stats:', {
        totalUpdates: this.updateCount,
        lastUpdate: this.lastUpdate ? this.lastUpdate.toISOString() : 'Never',
        isIOS: this.isIOS,
        protocol: window.location.protocol
      });
      this.watchId = null;
    }
  }
} 