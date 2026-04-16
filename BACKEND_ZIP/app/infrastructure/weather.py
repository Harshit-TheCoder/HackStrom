import httpx
from app.core.config import settings

class OpenWeatherClient:
    """Client to interact with the OpenWeather API."""
    
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        
    async def get_weather_by_city(self, city_name: str) -> dict:
        """Fetch weather data for a given city."""
        if not self.api_key:
            # Mock data for hackathon if no key is provided
            return {
                "weather": [{"main": "Thunderstorm", "description": "heavy thunderstorm"}],
                "main": {"temp": 298.15, "humidity": 85},
                "wind": {"speed": 15.5}
            }
            
        async with httpx.AsyncClient() as client:
            params = {
                "q": city_name,
                "appid": self.api_key,
                "units": "metric"
            }
            try:
                response = await client.get(f"{self.BASE_URL}/weather", params=params)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Error fetching weather: {e}")
                # Fallback in case of failure
                return {"weather": [{"main": "Unknown"}]}

weather_client = OpenWeatherClient()
