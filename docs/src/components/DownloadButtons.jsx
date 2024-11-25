'use client'

import { useState } from 'react'
import axios from 'axios'
import { Button } from './Button'

const DownloadButton = ({ children, assetFilter }) => {
    const [isLoading, setIsLoading] = useState(false)

    const getReleases = async () => {
        try {
            return await axios.get(
                "https://api.github.com/repos/Surfer-Org/Protocol/releases"
            )
        } catch (error) {
            console.error(`Error getting releases: ${error}`)
        }
    }

    const getLatestRelease = async () => {
        setIsLoading(true)
        try {
            const releases = await getReleases()
            const filteredReleases = releases.data
                .filter((release) => release.assets.some(assetFilter))
                .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
            if (filteredReleases.length) {
                window.location.href = filteredReleases[0].assets.find(assetFilter).browser_download_url
            }
        } catch (error) {
            console.error(`Error getting latest release: ${error}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button onClick={getLatestRelease} disabled={isLoading}>
            {isLoading ? "Fetching..." : children}
        </Button>
    )
}

const DownloadButtons = () => {
    return (
        <div className="not-prose">
            <div className="flex flex-row gap-4 my-6">
                <DownloadButton 
                    assetFilter={asset => 
                        asset.name.includes(".dmg") && 
                        !asset.name.includes("arm64.dmg") && 
                        !asset.name.includes(".blockmap")
                    }
                >
                    Download for Intel-based Macs
                </DownloadButton>

                <DownloadButton 
                    assetFilter={asset => 
                        asset.name.includes("arm64.dmg") && 
                        !asset.name.includes(".blockmap")
                    }
                >
                    Download for Apple Silicon Macs
                </DownloadButton>

                <DownloadButton 
                    assetFilter={asset => asset.name.includes(".exe")}
                >
                    Download for Windows
                </DownloadButton>
            </div>
        </div>
    )
}

export { DownloadButtons as default }