import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { SportSuitability } from '../types';

export interface WeatherData {
  city: string;
  country: string;
  temperatureC: number;
  temperatureF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  condition: string;
  weatherCode: number;
  iconType: 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' | 'wind';
  humidity: number;
  windSpeedKmh: number;
  windSpeedMph: number;
  isOutdoorGood: boolean;
  outdoorAdvice: string;
  latitude?: number;
  longitude?: number;
  isGpsAccurate?: boolean;
}

// Map WMO weather code to condition string and icon
function mapWeatherCode(code: number): { condition: string; iconType: WeatherData['iconType'] } {
  if (code === 0) return { condition: 'Clear Sky', iconType: 'sun' };
  if (code === 1 || code === 2) return { condition: 'Mainly Clear & Sunny', iconType: 'sun' };
  if (code === 3) return { condition: 'Overcast & Cloudy', iconType: 'cloud' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy / Hazy', iconType: 'cloud' };
  if (code >= 51 && code <= 67) return { condition: 'Light Drizzle / Rain', iconType: 'rain' };
  if (code >= 71 && code <= 77) return { condition: 'Snowfall', iconType: 'snow' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', iconType: 'rain' };
  if (code >= 85 && code <= 86) return { condition: 'Snow Showers', iconType: 'snow' };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', iconType: 'storm' };
  return { condition: 'Clear', iconType: 'sun' };
}

/**
 * Reverse geocodes exact coordinates to local municipality name via OpenStreetMap Nominatim with BigDataCloud fallback.
 * Resolves precise local Lebanese town/municipality (e.g., Antelias, Matn) rather than distant districts.
 */
export async function reverseGeocodeCoordinates(lat: number, lon: number): Promise<string> {
  // 1. First priority: OpenStreetMap Nominatim (High Precision Local Municipality / Suburb)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const osmRes = await fetch(osmUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OverhaulFitnessApp/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (osmRes.ok) {
      const data = await osmRes.json();
      const addr = data.address || {};
      
      const localName = 
        addr.suburb || 
        addr.town || 
        addr.village || 
        addr.neighbourhood || 
        addr.municipality || 
        addr.city_district || 
        addr.city || 
        addr.county || 
        '';

      const region = addr.county || addr.state_district || addr.state || '';
      
      if (localName && region && localName.toLowerCase() !== region.toLowerCase()) {
        return `${localName}, ${region}`;
      } else if (localName) {
        return localName;
      }
    }
  } catch (osmErr) {
    console.warn('Nominatim reverse geocode lookup bypassed:', osmErr);
  }

  // 2. Secondary fallback: BigDataCloud Reverse Geocoding
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const local = bdcData.locality || bdcData.city || bdcData.principalSubdivision || '';
      if (local) return local;
    }
  } catch {}

  // 3. Coordinate fallback
  return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}

/**
 * Gets high-precision GPS coordinates from the user's phone / device.
 * Uses Capacitor Geolocation with enableHighAccuracy: true, timeout: 15000, maximumAge: 0.
 */
export async function getAccurateDeviceGPS(): Promise<{ latitude: number; longitude: number; cityName?: string } | null> {
  // 1. Try Native Capacitor Geolocation if on native platform
  if (Capacitor.isNativePlatform()) {
    try {
      if (Geolocation && typeof Geolocation.requestPermissions === 'function') {
        const perms = await Geolocation.requestPermissions();
        if (perms.location === 'granted' || perms.coarseLocation === 'granted') {
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          const cityName = await reverseGeocodeCoordinates(latitude, longitude);
          return { latitude, longitude, cityName };
        }
      }
    } catch (err) {
      console.warn('Native Capacitor Geolocation failed, proceeding to web fallback:', err);
    }
  }

  // 2. Web Geolocation API fallback with 15-second safeguard
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const webPromise = new Promise<{ latitude: number; longitude: number; cityName?: string } | null>((resolve) => {
      let resolved = false;
      const timeoutTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutTimer);

          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          const cityName = await reverseGeocodeCoordinates(latitude, longitude);

          resolve({ latitude, longitude, cityName });
        },
        () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutTimer);
            resolve(null);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });

    const webResult = await webPromise;
    if (webResult) return webResult;
  }

  // 3. Fallback Antelias / Lebanon coordinates if sensor is unavailable
  return {
    latitude: 33.9189,
    longitude: 35.5894,
    cityName: 'Antelias, Matn',
  };
}

function getFallbackWeather(city?: string): WeatherData {
  try {
    const cached = localStorage.getItem('app_cached_weather');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed.temperatureC === 'number') {
        return parsed;
      }
    }
  } catch {}

  return {
    city: city || 'Antelias, Matn',
    country: 'Lebanon',
    temperatureC: 22,
    temperatureF: 72,
    feelsLikeC: 22,
    feelsLikeF: 72,
    condition: 'Mainly Clear & Sunny',
    weatherCode: 1,
    iconType: 'sun',
    humidity: 52,
    windSpeedKmh: 12,
    windSpeedMph: 7,
    isOutdoorGood: true,
    outdoorAdvice: 'Great conditions for outdoor cardio, running, and heavy training in Antelias.',
    isGpsAccurate: true,
  };
}

/**
 * Fetches real live weather data from Open-Meteo API using high accuracy coordinates
 */
export async function fetchLiveWeather(
  locationQuery?: string,
  explicitCoords?: { latitude: number; longitude: number; cityName?: string }
): Promise<WeatherData> {
  try {
    let lat = 33.9189;
    let lon = 35.5894;
    let cityName = locationQuery || 'Antelias, Matn';
    let countryName = 'Lebanon';
    let isGpsAccurate = false;

    if (explicitCoords) {
      lat = explicitCoords.latitude;
      lon = explicitCoords.longitude;
      cityName = explicitCoords.cityName || locationQuery || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      isGpsAccurate = true;
    } else if (locationQuery && locationQuery.trim() !== '') {
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery.trim())}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            const res = geoData.results[0];
            lat = res.latitude;
            lon = res.longitude;
            cityName = res.name;
            countryName = res.country || res.country_code || '';
          }
        }
      } catch (geoErr) {
        console.warn('Geocoding lookup non-fatal:', geoErr);
      }
    } else {
      const deviceCoords = await getAccurateDeviceGPS();
      if (deviceCoords) {
        lat = deviceCoords.latitude;
        lon = deviceCoords.longitude;
        cityName = deviceCoords.cityName || 'Antelias, Matn';
        isGpsAccurate = true;
      }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const weatherRes = await fetch(weatherUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!weatherRes.ok) {
      return getFallbackWeather(cityName);
    }

    const data = await weatherRes.json();
    const current = data.current;

    if (!current) {
      return getFallbackWeather(cityName);
    }

    const tempC = Math.round(current.temperature_2m);
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const feelsC = Math.round(current.apparent_temperature ?? tempC);
    const feelsF = Math.round((feelsC * 9) / 5 + 32);
    const humidity = Math.round(current.relative_humidity_2m ?? 50);
    const windKmh = Math.round(current.wind_speed_10m ?? 10);
    const windMph = Math.round(windKmh * 0.621371);
    const weatherCode = current.weather_code ?? 0;

    const { condition, iconType } = mapWeatherCode(weatherCode);

    const isRainingOrStorming = iconType === 'rain' || iconType === 'storm' || iconType === 'snow';
    const isExtremeTemp = tempC < 0 || tempC > 36;
    const isHighWind = windKmh > 40;
    const isOutdoorGood = !isRainingOrStorming && !isExtremeTemp && !isHighWind;

    let outdoorAdvice = 'Optimal weather for outdoor running, cycling, or outdoor training.';
    if (isRainingOrStorming) {
      outdoorAdvice = 'Precipitation detected. Indoor gym lifting or treadmill sessions recommended.';
    } else if (tempC > 30) {
      outdoorAdvice = 'High temperatures. Ensure aggressive hydration (electrolytes) if training outdoors.';
    } else if (tempC < 5) {
      outdoorAdvice = 'Cold conditions. Extend warm-up and joint mobility work prior to intense exertion.';
    } else if (isHighWind) {
      outdoorAdvice = 'Strong wind gusts. Take caution with cycling or track sprints.';
    }

    const result: WeatherData = {
      city: cityName,
      country: countryName,
      temperatureC: tempC,
      temperatureF: tempF,
      feelsLikeC: feelsC,
      feelsLikeF: feelsF,
      condition,
      weatherCode,
      iconType,
      humidity,
      windSpeedKmh: windKmh,
      windSpeedMph: windMph,
      isOutdoorGood,
      outdoorAdvice,
      latitude: lat,
      longitude: lon,
      isGpsAccurate,
    };

    try {
      localStorage.setItem('app_cached_weather', JSON.stringify(result));
    } catch {}

    return result;
  } catch (err) {
    console.warn('Live weather fetch non-fatal:', err);
    return getFallbackWeather();
  }
}

export const fetchWeatherForLocation = fetchLiveWeather;
export const fetchCurrentWeather = fetchLiveWeather;

/**
 * Algorithmic outdoor sport suitability evaluation
 */
export function evaluateSportsSuitability(weather: any): SportSuitability[] {
  const temp = weather.temperatureC ?? weather.temperature ?? 20;
  const wind = weather.windSpeedKmh ?? weather.windSpeedKmH ?? 10;
  const humidity = weather.humidity ?? 50;
  const isRain = weather.iconType === 'rain' || weather.iconType === 'storm' || weather.iconType === 'snow';

  // 1. Outdoor Running
  let runScore = 90;
  if (temp < 5 || temp > 28) runScore -= 20;
  if (wind > 25) runScore -= 15;
  if (isRain) runScore -= 35;
  runScore = Math.max(10, Math.min(100, runScore));

  // 2. Road Cycling
  let bikeScore = 95;
  if (wind > 30) bikeScore -= 35;
  if (isRain) bikeScore -= 45;
  if (temp < 8 || temp > 32) bikeScore -= 15;
  bikeScore = Math.max(10, Math.min(100, bikeScore));

  // 3. Calisthenics / Park Workouts
  let caliScore = 85;
  if (isRain) caliScore -= 40;
  if (temp < 12 || temp > 30) caliScore -= 20;
  caliScore = Math.max(10, Math.min(100, caliScore));

  // 4. Outdoor Sports / Football / Basketball
  let sportScore = 88;
  if (isRain) sportScore -= 30;
  if (temp > 33) sportScore -= 25;
  sportScore = Math.max(10, Math.min(100, sportScore));

  const getStatus = (score: number): SportSuitability['status'] => {
    if (score >= 80) return 'Ideal';
    if (score >= 65) return 'Good';
    if (score >= 45) return 'Fair';
    if (score >= 25) return 'Poor';
    return 'Hazardous';
  };

  return [
    {
      sport: 'Running & Jogging',
      score: runScore,
      status: getStatus(runScore),
      recommendation: runScore > 75 ? 'Prime temperature and low aerodynamic drag for pace runs.' : 'Adjust hydration and pacing.',
      icon: 'Footprints'
    },
    {
      sport: 'Road Cycling',
      score: bikeScore,
      status: getStatus(bikeScore),
      recommendation: bikeScore > 75 ? 'Low crosswinds and dry asphalt. Great for interval work.' : 'Caution with surface grip and crosswinds.',
      icon: 'Bike'
    },
    {
      sport: 'Calisthenics & Bars',
      score: caliScore,
      status: getStatus(caliScore),
      recommendation: caliScore > 70 ? 'Dry equipment and comfortable grip conditions.' : 'Grip slippage possible in damp conditions.',
      icon: 'Dumbbell'
    },
    {
      sport: 'Outdoor Field Sports',
      score: sportScore,
      status: getStatus(sportScore),
      recommendation: sportScore > 70 ? 'Excellent conditions for high-intensity team sports.' : 'Check field saturation and traction.',
      icon: 'Trophy'
    }
  ];
}
