## Surfer Protocol Setup Guide

Before you can start contributing, please follow these steps to set up the development environment:

1. Fork the repository:

2. Clone the forked repository:
   ```
   git clone https://github.com/YOUR_GITHUB_USERNAME/Protocol.git
   ```

## Desktop App

1. Install the required dependencies:
   ```
   cd Surfer-Protocol/desktop
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

## Python SDK

1. Navigate to the Python SDK directory:
   ```bash
   cd Surfer-Protocol/sdk/python
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install development dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -e .
   ```

4. Test the package:
   ```bash
   python -m surfer_protocol
   ```

5. You can now import and use the package in your Python code:
   ```python
   from surfer_protocol import SurferClient
   
   client = SurferClient()
   # Make sure the desktop app is running before testing
   data = client.get("bookmarks-001")
   ```

## Docs

1. Install the required dependencies:
   ```
   cd Surfer-Protocol/docs
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## Landing Page

1. Install the required dependencies:
   ```
   cd Surfer-Protocol/landing
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

This will run the application in development mode, allowing you to test your changes and see the results in real-time.
