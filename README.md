# Quercle Chat

A modern, AI-powered chat interface built with Next.js and the Quercle AI SDK. Chat with AI models from OpenRouter with a beautiful, responsive UI and persistent conversation history.

**Live Demo:** [https://chat.quercle.dev](https://chat.quercle.dev)

## Features

- **Multi-Provider AI Support** - Connect to OpenRouter and Quercle AI services
- **Persistent Conversations** - All chats saved locally using IndexedDB
- **Real-time Streaming** - Watch responses stream in real-time
- **Tool Calling Visualization** - See AI agent tool usage with detailed cards
- **Thinking Process Display** - Collapsible reasoning blocks show AI's thought process
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark Mode UI** - Beautiful dark theme with Tailwind CSS
- **Conversation Management** - Create, rename, and delete conversations
- **Model Selection** - Choose from various AI models

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** Bun 1.x
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui
- **Icons:** Lucide React
- **Database:** IndexedDB (via Dexie.js)
- **AI SDK:** [@quercle/ai-sdk](https://www.npmjs.com/package/@quercle/ai-sdk), [@openrouter/ai-sdk-provider](https://www.npmjs.com/package/@openrouter/ai-sdk-provider)
- **State Management:** React Hooks

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.x or later
- OpenRouter API key (optional)
- Quercle API key (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/LiranYoffe/quercle-chat.git
cd quercle-chat

# Install dependencies
bun install

# Run the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Configuration

1. Click the settings icon in the header
2. Choose your AI provider (OpenRouter or Quercle)
3. Enter your API key
4. Select a model
5. Start chatting!

All settings are stored locally in your browser.

## Development

```bash
# Run development server
bun dev

# Build for production
bun run build

# Start production server
bun start

# Run linter
bun run lint
```

## Project Structure

```
quercle-chat/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main chat page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── chat/             # Chat-related components
│   ├── layout/           # Layout components
│   ├── settings/         # Settings components
│   ├── sidebar/          # Sidebar components
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and hooks
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript types
│   └── db.ts             # IndexedDB configuration
└── public/               # Static assets
```

## Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LiranYoffe/quercle-chat)

The app is configured to use Bun on Vercel via `vercel.json`.

### Manual Deployment

1. Build the app: `bun run build`
2. Deploy the `.next` folder to your hosting provider
3. Ensure Bun 1.x is available in the environment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Links

- [Quercle AI SDK](https://www.npmjs.com/package/@quercle/ai-sdk)
- [OpenRouter](https://openrouter.ai/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Bun Documentation](https://bun.sh/docs)
