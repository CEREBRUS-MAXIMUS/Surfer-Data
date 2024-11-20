export async function getRawCode(url) { 
    const rawUrl = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/')
    const response = await fetch(rawUrl)
    const text = await response.text()
    return text
}

