import React, { useState, useEffect } from 'react';

type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';

interface WeatherState {
  type: WeatherType;
  intensity: number; // 0-1 scale
  windSpeed: number; // 0-1 scale
  windDirection: number; // degrees 0-359
  temperature: number; // celsius
  humidity: number; // 0-1 scale
  time: {
    hour: number; // 0-23
    minute: number; // 0-59
    totalDayMinutes: number; // minutes elapsed in current day
    dayLength: number; // total day length in minutes
    moonPhase: number; // 0-7 (0 = new moon, 4 = full moon)
    daysPassed: number; // total days passed in game
  };
  isNight: boolean;
}

interface WeatherInfoProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  detailed?: boolean;
}

export default function WeatherInfo({
  position = 'top-left',
  detailed = false
}: WeatherInfoProps) {
  // In a real app, this would be fetched from the game state
  const [weather, setWeather] = useState<WeatherState>({
    type: 'clear',
    intensity: 0,
    windSpeed: 0.2,
    windDirection: 45,
    temperature: 22,
    humidity: 0.4,
    time: {
      hour: 12,
      minute: 30,
      totalDayMinutes: 750,
      dayLength: 1440,
      moonPhase: 2,
      daysPassed: 3
    },
    isNight: false
  });
  
  // Simulate weather changes
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => {
        // Simulate time passing
        let newHour = prev.time.hour;
        let newMinute = prev.time.minute + 5; // 5 minutes per interval
        if (newMinute >= 60) {
          newMinute = 0;
          newHour++;
          if (newHour >= 24) {
            newHour = 0;
          }
        }
        
        const totalDayMinutes = newHour * 60 + newMinute;
        const isNight = newHour < 6 || newHour >= 18;
        
        // Occasionally change weather
        let newType = prev.type;
        let newIntensity = prev.intensity;
        
        if (Math.random() < 0.1) {
          // 10% chance of weather change
          const weatherTypes: WeatherType[] = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'];
          // Weight towards current type
          const currentIndex = weatherTypes.indexOf(prev.type);
          const possibleChanges = [];
          
          // Add current type multiple times to weight towards it
          for (let i = 0; i < 5; i++) possibleChanges.push(currentIndex);
          
          // Add adjacent types
          if (currentIndex > 0) possibleChanges.push(currentIndex - 1);
          if (currentIndex < weatherTypes.length - 1) possibleChanges.push(currentIndex + 1);
          
          // Random chance of big weather shift
          if (Math.random() < 0.2) {
            possibleChanges.push(Math.floor(Math.random() * weatherTypes.length));
          }
          
          const newTypeIndex = possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
          newType = weatherTypes[newTypeIndex];
          
          // Adjust intensity with some randomness
          newIntensity = Math.max(0, Math.min(1, prev.intensity + (Math.random() - 0.5) * 0.4));
        }
        
        return {
          ...prev,
          type: newType,
          intensity: newIntensity,
          windSpeed: Math.max(0, Math.min(1, prev.windSpeed + (Math.random() - 0.5) * 0.1)),
          windDirection: (prev.windDirection + Math.floor((Math.random() - 0.5) * 20)) % 360,
          time: {
            ...prev.time,
            hour: newHour,
            minute: newMinute,
            totalDayMinutes,
          },
          isNight
        };
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get weather icon based on type and time
  const getWeatherIcon = (): string => {
    if (weather.isNight) {
      // Night icons
      switch(weather.type) {
        case 'clear': return '🌙';
        case 'cloudy': return '☁️';
        case 'rain': return '🌧️';
        case 'storm': return '⛈️';
        case 'snow': return '❄️';
        case 'fog': return '🌫️';
        default: return '🌙';
      }
    } else {
      // Day icons
      switch(weather.type) {
        case 'clear': return '☀️';
        case 'cloudy': return '⛅';
        case 'rain': return '🌦️';
        case 'storm': return '⛈️';
        case 'snow': return '🌨️';
        case 'fog': return '🌫️';
        default: return '☀️';
      }
    }
  };
  
  // Format time as HH:MM
  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };
  
  // Get direction name from degrees
  const getWindDirectionName = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  };
  
  // Format the weather description
  const getWeatherDescription = (): string => {
    const intensity = weather.intensity > 0.7 ? 'Heavy' : weather.intensity > 0.3 ? 'Moderate' : 'Light';
    const time = weather.isNight ? 'Night' : 'Day';
    
    if (weather.type === 'clear') {
      return `${weather.isNight ? 'Clear' : 'Sunny'} ${time}`;
    }
    
    return `${intensity} ${weather.type.charAt(0).toUpperCase() + weather.type.slice(1)}`;
  };
  
  // Get moon phase name
  const getMoonPhaseName = (phase: number): string => {
    const phases = [
      'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
      'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
    ];
    return phases[phase];
  };
  
  // Get temperature color
  const getTemperatureColor = (): string => {
    if (weather.temperature < 0) return 'text-blue-400';
    if (weather.temperature > 30) return 'text-red-400';
    return 'text-white';
  };
  
  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-10`}>
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center">
          <div className="text-2xl mr-3">{getWeatherIcon()}</div>
          <div>
            <div className="text-sm font-medium text-white">{getWeatherDescription()}</div>
            <div className="flex items-center text-xs text-gray-300">
              <span className={getTemperatureColor()}>{Math.round(weather.temperature)}°C</span>
              <span className="mx-1">•</span>
              <span>{formatTime(weather.time.hour, weather.time.minute)}</span>
              {detailed && (
                <>
                  <span className="mx-1">•</span>
                  <span>Day {weather.time.daysPassed + 1}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {detailed && (
          <>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">Wind:</span>
                  <span className="text-white">
                    {getWindDirectionName(weather.windDirection)} {Math.round(weather.windSpeed * 100)} km/h
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">Humidity:</span>
                  <span className="text-white">
                    {Math.round(weather.humidity * 100)}%
                  </span>
                </div>
                {weather.isNight && (
                  <div className="flex items-center col-span-2">
                    <span className="text-gray-400 mr-1">Moon:</span>
                    <span className="text-white">
                      {getMoonPhaseName(weather.time.moonPhase)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Special events banner */}
            {weather.time.daysPassed % 14 === 13 && weather.isNight && (
              <div className="mt-2 py-1 px-2 bg-red-900 text-red-200 rounded text-xs font-medium animate-pulse">
                Blood Moon Tonight
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}