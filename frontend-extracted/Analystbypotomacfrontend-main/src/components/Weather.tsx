type WeatherProps = {
  temperature: number;
  weather: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  forecast?: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
  }>;
};

export const Weather = ({ temperature, weather, location, humidity, windSpeed, forecast }: WeatherProps) => {
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <h2 style={{ 
        marginBottom: '20px', 
        color: '#111827', 
        fontSize: '24px', 
        fontWeight: 'bold' 
      }}>
        Current Weather for {location}
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Condition</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{weather}</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Temperature</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{temperature}°F</div>
        </div>
        
        {humidity !== undefined && (
          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Humidity</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{humidity}%</div>
          </div>
        )}
        
        {windSpeed !== undefined && (
          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Wind Speed</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{windSpeed} mph</div>
          </div>
        )}
      </div>
      
      {forecast && forecast.length > 0 && (
        <div>
          <h3 style={{ 
            marginBottom: '12px', 
            color: '#374151', 
            fontSize: '18px', 
            fontWeight: '600' 
          }}>
            Forecast
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
          }}>
            {forecast.map((day, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  {day.day}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {day.condition}
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  H: {day.high}° L: {day.low}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};