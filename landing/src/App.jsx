import { Tweet } from 'react-tweet'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <img src="public/logo.svg" alt="Surfer Protocol" className="h-8 w-auto" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
              <a href="https://github.com/Surfer-Org/Protocol" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Export and Build Apps with</span>
                  <span className="block text-blue-600">Your Personal Data</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Your personal data is siloed across many platforms. Take control back with Surfer Protocol - the open-source framework for exporting and building applications with your data.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                      Download App
                    </a>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10">
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to control your data
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Feature items */}
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    {/* Icon */}
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Desktop App</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Export your data from popular platforms and services with our easy-to-use desktop application.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    {/* Icon */}
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Python SDK</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Build applications using your personal data with our comprehensive Python SDK.
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple 3-step process
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {/* Steps */}
              {[
                {
                  title: "Export Your Data",
                  description: "Click export and let our app handle the data extraction process"
                },
                {
                  title: "Process & Store",
                  description: "Your data is processed and stored securely on your local machine"
                },
                {
                  title: "Build & Create",
                  description: "Use our SDK to build applications with your exported data"
                }
              ].map((step, index) => (
                <div key={index} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      {index + 1}
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{step.title}</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    {step.description}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Updated Testimonials Section */}
      <div id="testimonials" className="py-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              What people are saying
            </p>
          </div>
          
          <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_32px,_black_calc(100%-32px),transparent_100%)]">
            <div className="flex animate-infinite-scroll gap-8 items-start">
              {[
                "1824171255211155463",
                "1825952058484339046",
                "1824212974472663440",
                "1824582877268545664",
                "1824404896168210893",
                "1824212957200609515"
              ].map((id) => (
                <div key={id} className="w-[400px] flex-shrink-0">
                  <Tweet id={id} />
                </div>
              ))}
            </div>
            <div className="flex animate-infinite-scroll gap-8 items-start" aria-hidden="true">
              {[
                "1824171255211155463",
                "1825952058484339046",
                "1824212974472663440",
                "1824582877268545664",
                "1824404896168210893",
                "1824212957200609515"
              ].map((id) => (
                <div key={id} className="w-[400px] flex-shrink-0">
                  <Tweet id={id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to dive in?</span>
            <span className="block text-blue-200">Download Surfer Protocol today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a href="#" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                Get started
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="https://github.com/Surfer-Org/Protocol" className="text-gray-400 hover:text-gray-500">
              GitHub
            </a>
            <a href="https://discord.gg/5KQkWApkYC" className="text-gray-400 hover:text-gray-500">
              Discord
            </a>
            <a href="https://twitter.com/SurferProtocol" className="text-gray-400 hover:text-gray-500">
              Twitter
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2024 Surfer Protocol. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const styles = `
  @keyframes infinite-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .animate-infinite-scroll {
    animation: infinite-scroll 40s linear infinite;
  }

  /* Optional: Pause animation on hover */
  .animate-infinite-scroll:hover {
    animation-play-state: paused;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
