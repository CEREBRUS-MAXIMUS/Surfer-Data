from setuptools import setup, find_packages

setup(
    name="surfer-client",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.1",
    ],
    author="Sahil Lalani",
    author_email="your.email@example.com",
    description="Python client for Surfer-Data desktop app",
    keywords="surfer-data, client",
)