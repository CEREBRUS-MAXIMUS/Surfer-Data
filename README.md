# Surfer: The World's First Digital Footprint Exporter

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>


![Surfer Diagram](assets/SurferDemo.mp4)


Surfer is the world's first digital footprint exporter, designed to centralize all your personal data from various online platforms into a single folder.

Currently, your personal data is scattered across hundreds of platforms and the companies operating these platforms have no incentive to give this data back to you. Surfer solves this problem by navigating to websites and scraping data from these websites.

We believe that personal data centralization is the key to enabling truly useful, universal personal assistants.

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

## Getting Started

To download the app, head over to [https://surfsup.web.app](https://surfsup.web.app). Or you can go to the releases page.

For instructions on setting up the app locally and contributing to the project, please refer to the [Contributing Guidelines](CONTRIBUTING.md), [Helper Functions Documentation](docs/HELPER_FUNCTIONS.md), and [Guide to Adding New Platforms](docs/ADD_PLATFORMS.md).

See the [open issues](https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/issues) for a full list of proposed features (and known issues).

## Roadmap

### Short-Term
- [ ] Obtain a code signing certificate for Windows
- [x] Replace `setTimeout` with `await` for script execution to ensure elements exist before scraping
- [ ] Implement robust error handling for the scraping process
- [ ] Add support for more online platforms
- [ ] Add verbosity to runs

### Medium to Long-Term
- [ ] Implement concurrent scraping to allow for multiple scraping jobs to run simultaneously
- [ ] Adding sub-tasks within platforms (i.e. Twitter Bookmarks, LinkedIn Connections Data, etc)
- [ ] Integrate with other agentic frameworks like LangChain for advanced personal AI assistants
- [ ] Explore integration with wearable devices for enhanced personal data tracking and acknowledgment

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Built With

* [![Electron][Electron.js]][Electron-url]
* [![React][React.js]][React-url]
* [![Tailwind][Tailwind.css]][Tailwind-url]
* [![Shadcn UI][Shadcn.ui]][Shadcn-url]

## Contact

[Surfer Discord Server](https://discord.gg/Tjg7pjcFNP) - [@SahilLalani0](https://x.com/SahilLalani0) - [@JackBlair87](https://x.com/JackBlair87) - [@T0M_3D](https://x.com/T0M_3D)

Project Link: [https://github.com/CEREBRUS-MAXIMUS/Surfer-Data](https://github.com/CEREBRUS-MAXIMUS/Surfer-Data)

## Acknowledgements

- [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

[contributors-shield]: https://img.shields.io/github/contributors/CEREBRUS-MAXIMUS/Surfer-Data.svg?style=for-the-badge
[contributors-url]: https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/CEREBRUS-MAXIMUS/Surfer-Data.svg?style=for-the-badge
[forks-url]: https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/network/members
[stars-shield]: https://img.shields.io/github/stars/CEREBRUS-MAXIMUS/Surfer-Data.svg?style=for-the-badge
[stars-url]: https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/stargazers
[issues-shield]: https://img.shields.io/github/issues/CEREBRUS-MAXIMUS/Surfer-Data.svg?style=for-the-badge
[issues-url]: https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/issues
[license-shield]: https://img.shields.io/github/license/CEREBRUS-MAXIMUS/Surfer-Data.svg?style=for-the-badge
[license-url]: https://github.com/CEREBRUS-MAXIMUS/Surfer-Data/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/cerebrus-maximus
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Tailwind.css]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Electron.js]: https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9
[Electron-url]: https://www.electronjs.org/
[Shadcn.ui]: https://img.shields.io/badge/Shadcn_UI-F05032?style=for-the-badge&logo=shadcn&logoColor=white
[Shadcn-url]: https://ui.shadcn.com/