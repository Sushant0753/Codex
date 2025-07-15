# Codex: Online Coding Platform

## Overview

Codex is a modern web-based coding platform built with Next.js 14, designed to provide an interactive and seamless coding experience for developers, students, and coding enthusiasts.

## 🚀 Features

### Core Functionality
- Interactive code editor with syntax highlighting
- Real-time code execution for Python
- Problem submission and tracking system
- Submission history and results tracking
- Dark mode support
- Responsive design

### Technical Stack
- **Frontend**: Next.js 14
- **Editor**: Monaco Editor
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Code Execution**: Server-side Python runtime
- **UI Components**: Radix UI, Shadcn/ui

## 🛠 Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- Python 3.8+

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/codex.git
cd codex
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Create a `.env.local` file
- Add necessary configuration (database connection, API keys)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
codex/
├── src/
│   ├── app/
│   │   ├── api/          # API route handlers
│   │   ├── problems/     # Problem pages
│   │   ├── scripts/      # Utility scripts
│   │   └── page.tsx      # Main application page
│   ├── components/       # Reusable React components
│   └── lib/              # Utility functions
│   └── problems/         # Problems
└── public/               # Static assests
```

## 🧪 Testing

Run tests using:
```bash
npm test
```

## 🚢 Deployment

### Vercel Deployment
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deployment
1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🔒 Security

- Code execution is sandboxed
- Input sanitization implemented
- Timeout mechanisms prevent infinite loops

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

Your Name - [your.email@example.com](mailto:your.email@example.com)

Project Link: [https://github.com/your-username/codex](https://github.com/your-username/codex)

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Radix UI](https://www.radix-ui.com/)
