# AI Chat API Cloudflare Worker

A self-contained AI chat API that runs entirely within Cloudflare Workers.

## Features

- Multiple personality modes (friendly, professional, humorous)
- Built-in knowledge base
- No external API dependencies
- Configurable memory system

## Deployment

1. Install Wrangler CLI:
```bash
npm install -g @cloudflare/wrangler
```

2. Authenticate with Cloudflare:
```bash
wrangler login
```

3. Deploy the worker:
```bash
wrangler publish
```

## API Usage

Send POST requests to your worker URL with these parameters:

```json
{
  "personality": "friendly|professional|humorous",
  "content": "your message",
  "bio": "AI's role description",
  "prompt": "optional instructions",
  "memories": "optional context"
}
```
