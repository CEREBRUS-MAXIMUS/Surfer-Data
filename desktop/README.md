# Surfer Desktop App

> ### ⚠️ Looking for Surfer Protocol or the Surfer Python SDK? 
> Protocol: [Surfer Protocol](https://github.com/Surfer-Org/Protocol)\
> SDK: [Surfer Python SDK](https://github.com/Surfer-Org/Python-SDK)

## Demo (click to view)

[![YouTube](http://i.ytimg.com/vi/2P25iOd14qw/hqdefault.jpg)](https://www.youtube.com/watch?v=HuLnEFlQsHE&ab_channel=SahilLalani)

## Currently Supported Platforms
- iMessages
- Twitter Bookmarks
- Notion
- ChatGPT History
- Gmail
- LinkedIn Connections
- Reddit (coming soon!)
- GitHub (coming soon!)
- Discord (coming soon!)
- Spotify (coming soon!)

## How it works

![Surfer Diagram](assets/SurferDiagram.png)

1. Click on "Export" to initiate the data extraction process.
2. The app waits for the target page to load completely.
3. The system checks if the user is signed in to the platform being scraped.
4. If not signed in, the user is prompted to sign in.
5. If signed in, the process continues.
6. Once signed in, the app interacts with the platform's user interface.
7. The app then scrapes the user's data from the platform.
8. Finally, the extracted data is exported and saved to your local storage.

## Sample Exported Data

```json{
  "platform_name": "X Corp",
  "name": "Twitter",
  "runID": "twitter-001-1724267514217",
  "timestamp": 1724267623318,
  "content": [
    "Twitter Post 1",
    "Twitter Post 2",
    "Twitter Post 3",
    ...
  ]
}
```

## Getting Started

To download the app, head over to [https://surferprotocol.org/desktop/installation](https://surferprotocol.org/desktop/installation). Or you can go to the releases page.

For instructions on setting up the app locally and contributing to the project, please refer to the [Contributing Guidelines](CONTRIBUTING.md), [Helper Functions Documentation](docs/HELPER_FUNCTIONS.md), and [Guide to Adding New Platforms](docs/ADD_PLATFORMS.md).

See the [open issues](https://github.com/Surfer-Org/Protocol/issues) for a full list of proposed features (and known issues).

## License

Distributed under the MIT License. See [`LICENSE`](https://github.com/Surfer-Org/Protocol/tree/main/desktop/blob/main/LICENSE) for more information.

## Built With

* [![Electron][Electron.js]][Electron-url]
* [![React][React.js]][React-url]
* [![Tailwind][Tailwind.css]][Tailwind-url]
* [![Shadcn UI][Shadcn.ui]][Shadcn-url]

## Contact

[Surfer Discord Server](https://discord.gg/Tjg7pjcFNP) - [@SahilLalani0](https://x.com/SahilLalani0) - [@JackBlair87](https://x.com/JackBlair87) - [@T0M_3D](https://x.com/T0M_3D)

Project Link: [https://github.com/Surfer-Org/Protocol/tree/main/desktop](https://github.com/Surfer-Org/Protocol/tree/main/desktop)

## Acknowledgements

- [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)