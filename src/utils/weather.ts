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
 * Gets high-accuracy GPS coordinates from the user's phone / device
 */
export async function getAccurateDeviceGPS(): Promise<{ latitude: number; longitude: number; cityName?: string } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        let cityName = '';
        // Reverse geocoding using Open-Meteo reverse geocode or bigdatacloud open endpoint
        try {
          const revRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            cityName = revData.city || revData.locality || revData.principalSubdivision || '';
          }
        } catch {
          // Ignore reverse geocode failures
        }

        resolve({ latitude, longitude, cityName });
      },
      (err) => {
        console.warn('GPS location permission denied or timed out:', err);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

export async function fetchWeatherForLocation(
  locationQuery?: string,
  explicitCoords?: { latitude: number; longitude: number; cityName?: string }
): Promise<WeatherData> {
  let lat = 51.5074; // London default fallback
  let lon = -0.1278;
  let cityName = 'London';
  let countryName = 'UK';
  let isGpsAccurate = false;

  if (explicitCoords) {
    lat = explicitCoords.latitude;
    lon = explicitCoords.longitude;
    cityName = explicitCoords.cityName || 'Current GPS Location';
    countryName = '';
    isGpsAccurate = true;
  } else if (locationQuery && locationQuery.trim().length > 0) {
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery)}&count=1&language=en&format=json`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
          cityName = geoData.results[0].name;
          countryName = geoData.results[0].country_code || geoData.results[0].country || '';
        }
      }
    } catch (e) {
      console.warn('Geocoding search failed, using fallback', e);
    }
  }

  // Fetch current weather from Open-Meteo
  try {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh`
    );

    if (weatherRes.ok) {
      const data = await weatherRes.json();
      const current = data.current;
      const code = current?.weather_code ?? 0;
      const { condition, iconType } = mapWeatherCode(code);
      const tempC = Math.round(current?.temperature_2m ?? 20);
      const tempF = Math.round((tempC * 9) / 5 + 32);
      const feelsLikeC = Math.round(current?.apparent_temperature ?? tempC);
      const feelsLikeF = Math.round((feelsLikeC * 9) / 5 + 32);
      const windKmh = Math.round(current?.wind_speed_10m ?? 12);
      const windMph = Math.round(windKmh * 0.621371);
      const humidity = Math.round(current?.relative_humidity_2m ?? 55);

      const isOutdoorGood = tempC >= 8 && tempC <= 30 && code < 51;
      let outdoorAdvice = 'Ideal weather for outdoor bicycle ride, run, or brisk walk.';
      if (tempC < 8) outdoorAdvice = 'Chilly outside — wear thermal layers for your run or stick to gym lifting.';
      if (tempC > 30) outdoorAdvice = 'High heat — stay hydrated with electrolytes or train indoors.';
      if (code >= 51) outdoorAdvice = 'Rainy conditions — gym session recommended over outdoor cycling.';

      return {
        city: cityName,
        country: countryName,
        temperatureC: tempC,
        temperatureF: tempF,
        feelsLikeC,
        feelsLikeF,
        condition,
        weatherCode: code,
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
    }
  } catch (err) {
    console.error('Weather fetch error:', err);
  }

  // Fallback realistic weather
  return {
    city: locationQuery || 'London',
    country: 'UK',
    temperatureC: 19,
    temperatureF: 66,
    feelsLikeC: 19,
    feelsLikeF: 66,
    condition: 'Mainly Clear & Sunny',
    weatherCode: 1,
    iconType: 'sun',
    humidity: 62,
    windSpeedKmh: 14,
    windSpeedMph: 9,
    isOutdoorGood: true,
    outdoorAdvice: 'Mild & pleasant outdoor running or cycling conditions.',
  };
}
