# Surfer Protocol Python SDK

A Python SDK for interacting with the Surfer Protocol desktop application. Easily access and export data from various platforms like Twitter, Gmail, iMessage, and more.

## Prerequisites

The Surfer desktop application must be running in the background for the SDK to work. [Download here](https://docs.surferprotocol.org/desktop/installation).

## Installation

```bash
pip install surfer-protocol
```

## Quick Start

```python
from surfer_protocol import SurferClient

# Initialize the client
client = SurferClient()

# Get data for a specific platform
data = client.get("bookmarks-001")

# Export data for a platform
export_result = client.export("bookmarks-001")
```

## Examples

For examples of how to use the Surfer Protocol Python SDK to build applications, please see the [Cookbook](../../cookbook/python/README.md).

## Basic Usage

The SDK provides two main methods:
- `get(platform_id)`: Retrieve the most recent data for a platform
- `export(platform_id)`: Trigger a new export for a platform

## Supported Platforms

- Twitter Bookmarks (`bookmarks-001`)
- Gmail (`gmail-001`)
- iMessage (`imessage-001`)
- LinkedIn Connections (`connections-001`)
- Notion (`notion-001`)
- ChatGPT (`chatgpt-001`)

## Documentation

For complete documentation, including detailed API reference, response schemas, example applications, and best practices, visit our [official documentation](https://docs.surferprotocol.com/sdk/python).