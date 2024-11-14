import requests
from typing import Optional

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
            raise ConnectionError("Could not connect to Surfer-Data desktop app. Is it running?") from e


    def get(self, platform_id: str) -> dict:
        """Get the most recent run for a specific platform.
        """
        try:
            response = self.session.post(f"{self.base_url}/get", json={"platformId": platform_id})
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to get most recent run: {str(e)}") from e

    def export(self, platform_id: str) -> dict:
        """Trigger an export for a specific platform.
        
        Returns:
            dict: Response containing 'success' and 'exportComplete' data
        """
        try:
            response = self.session.post(f"{self.base_url}/export", json={"platformId": platform_id})
            response.raise_for_status()
            return response.json()  # Return the full response data
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to trigger export: {str(e)}") from e

    # Convenience methods for specific platforms
    def get_twitter_bookmarks(self) -> bool:
        return self.export("bookmarks-001")

    def __del__(self):
        """Cleanup the session when the client is destroyed."""
        self.session.close()