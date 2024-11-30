import requests

class SurferClient:
    def __init__(self, host: str = "localhost", port: int = 2024):
        self.base_url = f"http://{host}:{port}/api"
        self.session = requests.Session()
        self._check_connection()

    def _check_connection(self):
        try:
            # Try to connect to the desktop app
            response = self.session.get(f"{self.base_url}/health")
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise ConnectionError("Couldn't connect to the Surfer Desktop app. Is it running?") from e


    def get(self, platform_id: str) -> dict:
        """Get the most recent run for a specific platform.

        Raises:
            ConnectionError: If connection to desktop app fails
            ValueError: If no successful runs are found for the platform
        """
        try:
            response = self.session.post(f"{self.base_url}/get", json={"platformId": platform_id})
            
            # Handle 404 status codes specifically
            if response.status_code == 404:
                error_data = response.json()
                raise ValueError(error_data['error'])
            
            # Handle other HTTP errors
            response.raise_for_status()
            
            data = response.json()
            if not data.get('success'):
                raise ValueError(data.get('error', 'Unknown error occurred'))
                
            return data
            
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to get most recent run: {str(e)}") from e

    def export(self, platform_id: str) -> dict:
        """Trigger an export for a specific platform.
        
        Raises:
            ConnectionError: If connection to desktop app fails
            ValueError: If platform is not connected or export fails
        """
        try:
            response = self.session.post(f"{self.base_url}/export", json={"platformId": platform_id})
            response.raise_for_status()
            data = response.json()
            
            if not data.get('success'):
                raise ValueError(data.get('error', 'Export failed'))
                
            return data
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to trigger export: {str(e)}") from e

    def __del__(self):
        """Cleanup the session when the client is destroyed."""
        self.session.close()