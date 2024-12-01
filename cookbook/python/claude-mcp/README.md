# Claude MCP

1. Download the Claude Desktop App from https://claude.ai/download

2. Create a `claude_desktop_config.json` file in the root of the project with the following content. Look [here](https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem/README.md) for more details:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": [
        "C:/Users/username/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
        "[insert-folder-path-of-your-choice-here]"
      ]
    }
  }
}
```

**Note:** The path for the @modelcontextprotocol/server-filesystem package may vary based on your operating system. Look [here](https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem/README.md) for more details.

3. Restart the Claude Desktop App. You should see a plug and tool icon in the chat window:

4. You should be able to ask Claude about your data from Surfer. For example, you can ask it to read all the data in the exported folder and tell you what it found.

**Note:** Some files may be too large to read in full by Claude, so it may return an error for this. A solution is to implement a custom MCP server for Surfer that can read files in chunks or vectorize the data locally and expose that function to Claude. Feel free to reach out if you want to implement this!
