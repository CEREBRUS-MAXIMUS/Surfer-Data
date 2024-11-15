'use client'

import { Button } from './Button'

export function EditPage({ filepath }) {
  // Base GitHub repo URL - replace with your repository details
  const GITHUB_REPO = 'https://github.com/Surfer-Org/Protocol'
  const GITHUB_BRANCH = 'main' // or whatever your default branch is

  const editUrl = `${GITHUB_REPO}/tree/${GITHUB_BRANCH}/docs/src/app/${filepath}`

  return (
    <Button
      variant="outline"
      href={editUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      Edit this page on GitHub
    </Button>
  )
}
