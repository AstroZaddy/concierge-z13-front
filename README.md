# Z13 Astrology Frontend

A modern, responsive frontend for the Z13 Astrology API built with Astro, React, and Tailwind CSS v4. Features a cosmic-themed design system with neon accents and mobile-first responsive layouts.

## 🚀 Tech Stack

- **[Astro](https://astro.build)** - Static site framework
- **[React](https://react.dev)** - UI component library
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev)** - Icon library
- **[TypeScript](https://www.typescriptlang.org)** - Type safety

## 📁 Project Structure

```
/
├── public/              # Static assets (images, favicons, etc.)
├── src/
│   ├── components/      # React components
│   │   ├── sections/   # Page sections (Hero, CTA, etc.)
│   │   └── ui/         # Reusable UI components (NeonCard, NeonButton, etc.)
│   ├── layouts/        # Layout components
│   ├── pages/          # Astro pages (routes)
│   └── styles/         # Global CSS and Tailwind configuration
├── astro.config.mjs    # Astro configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Dependencies and scripts
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd z13-front
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:4321`

## 📜 Available Scripts

| Command           | Action                                           |
| :---------------- | :----------------------------------------------- |
| `npm run dev`     | Starts local dev server at `localhost:4321`      |
| `npm run build`   | Build your production site to `./dist/`          |
| `npm run preview` | Preview your build locally, before deploying     |
| `npm run astro`   | Run CLI commands like `astro add`, `astro check` |

## 🎨 Design System

This project uses a custom neon/cosmic design system:

- **Colors**: Custom neon palette (cyan, purple, magenta, yellow)
- **Components**: Reusable components like `NeonCard`, `NeonButton`, `NeonGradient`
- **Typography**: Responsive typography with mobile-first approach
- **Layout**: Grid-based responsive layouts that stack on mobile

### Custom Tailwind Theme

Custom colors and utilities are defined in `src/styles/global.css` using Tailwind v4's `@theme` directive.

## 📱 Responsive Design

The project follows a mobile-first approach:

- Cards stack vertically on mobile (`grid-cols-1`)
- Multi-column layouts on medium+ screens (`md:grid-cols-3`)
- Responsive typography: `text-sm` on mobile, `md:text-base` on larger screens

## 🔧 Configuration

### Tailwind CSS v4

This project uses Tailwind CSS v4 with CSS-based configuration. Custom theme values are defined in `src/styles/global.css` using the `@theme` directive.

### Astro Configuration

Astro is configured with:
- React integration for component support
- Tailwind CSS via `@tailwindcss/vite` plugin

## 📚 Learn More

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

## 📄 License

[Add your license here]
