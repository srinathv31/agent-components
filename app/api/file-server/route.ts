import { NextRequest, NextResponse } from "next/server";
import type { FileInfo, ListFilesResponse, ReadFileResponse } from "@/data/file-server.types";

// Mock file system structure
const FILES: FileInfo[] = [
  {
    path: "/docs/getting-started.md",
    name: "Getting Started",
    type: "file",
    description: "Initial setup guide for new developers",
  },
  {
    path: "/docs/tech-stack.md",
    name: "Tech Stack",
    type: "file",
    description: "Overview of our technology stack",
  },
  {
    path: "/docs/development-workflow.md",
    name: "Development Workflow",
    type: "file",
    description: "Git branching and PR process",
  },
  {
    path: "/docs/code-standards.md",
    name: "Code Standards",
    type: "file",
    description: "TypeScript and React best practices",
  },
  {
    path: "/docs/troubleshooting.md",
    name: "Troubleshooting",
    type: "file",
    description: "Common issues and solutions",
  },
  {
    path: "/docs/resources.md",
    name: "Resources",
    type: "file",
    description: "Useful links and contacts",
  },
];

// Mock file contents
const FILE_CONTENTS: Record<string, string> = {
  "/docs/getting-started.md": `# Getting Started

Welcome to the team! This guide will help you set up your development environment.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v20 or later) - [Download](https://nodejs.org/)
- **pnpm** (v9 or later) - Install with \`npm install -g pnpm\`
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

## Setup Steps

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/company/main-app.git
cd main-app
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 3. Environment Variables

Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Ask your team lead for the required API keys and secrets.

### 4. Start Development Server

\`\`\`bash
pnpm dev
\`\`\`

The app should now be running at \`http://localhost:3000\`

## VS Code Extensions

We recommend installing these extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer

## Next Steps

Once your environment is set up, check out:
- [Tech Stack](/docs/tech-stack.md) - Learn about our technologies
- [Development Workflow](/docs/development-workflow.md) - Understand our Git process
`,

  "/docs/tech-stack.md": `# Tech Stack

Our application is built with modern, battle-tested technologies.

## Frontend

### Framework: Next.js 16
- App Router for file-based routing
- Server Components for performance
- Server Actions for mutations
- Built-in API routes

### UI Layer
- **React 19** - Latest features including Server Components
- **TypeScript 5** - Type safety throughout
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Pre-built component library

### State Management
- React Context for global state
- Server state with React Query (where needed)
- URL state for shareable views

## Backend

### API Layer
- Next.js API Routes and Server Actions
- REST conventions with JSON responses
- Zod for runtime validation

### Database
- PostgreSQL with Prisma ORM
- Redis for caching and sessions

### Authentication
- NextAuth.js v5
- OAuth providers (Google, GitHub)
- Role-based access control

## AI Integration

- **Vercel AI SDK** - Streaming AI responses
- OpenAI GPT-4o for general tasks
- Google Gemini for multimodal features

## Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Vitest** - Unit testing
- **Playwright** - E2E testing
`,

  "/docs/development-workflow.md": `# Development Workflow

This document outlines our Git workflow and code review process.

## Branch Strategy

We use a simplified Git Flow:

- \`main\` - Production-ready code
- \`develop\` - Integration branch
- \`feature/*\` - New features
- \`fix/*\` - Bug fixes
- \`hotfix/*\` - Urgent production fixes

## Creating a Feature Branch

\`\`\`bash
# Start from develop
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/your-feature-name
\`\`\`

## Commit Messages

Follow conventional commits:

\`\`\`
type(scope): description

[optional body]
\`\`\`

Types:
- \`feat\` - New feature
- \`fix\` - Bug fix
- \`docs\` - Documentation
- \`style\` - Formatting
- \`refactor\` - Code restructuring
- \`test\` - Adding tests
- \`chore\` - Maintenance

Example:
\`\`\`
feat(auth): add Google OAuth login

- Implement OAuth flow with NextAuth
- Add user profile page
- Update navigation with auth state
\`\`\`

## Pull Request Process

1. **Push your branch**
   \`\`\`bash
   git push origin feature/your-feature-name
   \`\`\`

2. **Create PR on GitHub**
   - Use the PR template
   - Add relevant labels
   - Request reviews from 2 team members

3. **Address Review Feedback**
   - Respond to all comments
   - Push fixes as new commits
   - Re-request review when ready

4. **Merge**
   - Squash and merge to develop
   - Delete the feature branch

## Code Review Guidelines

As a reviewer:
- Be constructive and kind
- Focus on logic, not style (let linters handle that)
- Ask questions instead of making demands
- Approve when "good enough" - perfection isn't required
`,

  "/docs/code-standards.md": `# Code Standards

Guidelines for writing clean, maintainable code.

## TypeScript

### Use Strict Types

\`\`\`typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> { ... }

// Avoid
function getUser(id: any): Promise<any> { ... }
\`\`\`

### Prefer Interfaces for Objects

\`\`\`typescript
// Good
interface ButtonProps {
  variant: "primary" | "secondary";
  children: React.ReactNode;
}

// Avoid for object shapes
type ButtonProps = { ... }
\`\`\`

## React Patterns

### Component Structure

\`\`\`tsx
// 1. Imports
import { useState } from "react";

// 2. Types
interface Props {
  title: string;
}

// 3. Component
export function MyComponent({ title }: Props) {
  // Hooks first
  const [state, setState] = useState(false);

  // Event handlers
  const handleClick = () => { ... };

  // Render
  return <div>{title}</div>;
}
\`\`\`

### Naming Conventions

- Components: PascalCase (\`UserProfile.tsx\`)
- Hooks: camelCase with "use" prefix (\`useAuth.ts\`)
- Utilities: camelCase (\`formatDate.ts\`)
- Constants: SCREAMING_SNAKE_CASE

### File Organization

\`\`\`
components/
  ui/           # Base UI components
  features/     # Feature-specific components
hooks/          # Custom hooks
lib/            # Utility functions
types/          # Shared TypeScript types
\`\`\`

## CSS / Tailwind

### Prefer Tailwind Classes

\`\`\`tsx
// Good
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
  Click me
</button>

// Avoid inline styles
<button style={{ padding: "8px 16px" }}>
  Click me
</button>
\`\`\`

### Use cn() for Conditional Classes

\`\`\`tsx
import { cn } from "@/lib/utils";

<button className={cn(
  "px-4 py-2 rounded-lg",
  isPrimary && "bg-blue-500 text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
\`\`\`
`,

  "/docs/troubleshooting.md": `# Troubleshooting

Common issues and how to fix them.

## Build Errors

### "Module not found" Error

**Cause**: Missing dependency or incorrect import path.

**Solution**:
\`\`\`bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
\`\`\`

### TypeScript Errors After Pull

**Cause**: New types added by teammates.

**Solution**:
\`\`\`bash
# Regenerate types
pnpm generate-types
\`\`\`

## Runtime Errors

### "Hydration Mismatch" Warning

**Cause**: Server and client HTML don't match.

**Common fixes**:
- Wrap browser-only code in \`useEffect\`
- Use \`suppressHydrationWarning\` for unavoidable cases
- Check for date/time formatting differences

### API Route 500 Errors

**Checklist**:
1. Check server logs: \`pnpm dev\` terminal output
2. Verify environment variables are set
3. Test with Postman/curl to isolate frontend issues

## Development Environment

### Port Already in Use

\`\`\`bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
\`\`\`

### ESLint Not Working in VS Code

1. Open VS Code settings
2. Search for "ESLint: Enable"
3. Ensure it's checked
4. Restart VS Code

## Database Issues

### Prisma Migration Failed

\`\`\`bash
# Reset database (development only!)
pnpm prisma migrate reset

# Or push schema directly
pnpm prisma db push
\`\`\`

## Still Stuck?

1. Search our Slack #dev-help channel
2. Check the GitHub issues
3. Ask your buddy or team lead
`,

  "/docs/resources.md": `# Resources

Helpful links and contacts for new team members.

## Internal Resources

### Documentation
- [Notion Wiki](https://notion.so/company) - Product docs and specs
- [Storybook](https://storybook.company.dev) - UI component library
- [API Docs](https://api-docs.company.dev) - Backend API reference

### Communication
- **Slack** - Primary communication
  - \`#general\` - Company announcements
  - \`#dev-team\` - Engineering discussions
  - \`#dev-help\` - Ask questions here!
  - \`#random\` - Fun stuff

### Meetings
- **Daily Standup** - 9:30 AM (15 min)
- **Sprint Planning** - Monday 10 AM
- **Retro** - Friday 3 PM

## External Learning

### React & Next.js
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Total TypeScript](https://totaltypescript.com) (advanced)

### Design
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI](https://radix-ui.com)
- [shadcn/ui](https://ui.shadcn.com)

## Key Contacts

| Role | Name | Slack |
|------|------|-------|
| Engineering Manager | Sarah Chen | @sarah |
| Tech Lead | Marcus Johnson | @marcus |
| Product Manager | Emily Rodriguez | @emily |
| Design Lead | Alex Kim | @alex |
| DevOps | Jordan Taylor | @jordan |

## Onboarding Buddy Program

You've been assigned an onboarding buddy! They'll:
- Answer your questions (no question is too small)
- Help you navigate the codebase
- Introduce you to the team
- Check in weekly for your first month

Don't hesitate to reach out to them!
`,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "list") {
    const response: ListFilesResponse = { files: FILES };
    return NextResponse.json(response);
  }

  if (action === "read") {
    const filePath = searchParams.get("filePath");

    if (!filePath) {
      return NextResponse.json(
        { error: "filePath parameter is required" },
        { status: 400 }
      );
    }

    const content = FILE_CONTENTS[filePath];

    if (!content) {
      return NextResponse.json(
        { error: `File not found: ${filePath}` },
        { status: 404 }
      );
    }

    const response: ReadFileResponse = {
      fileContent: content,
      metadata: {
        path: filePath,
        lastModified: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  }

  return NextResponse.json(
    { error: "Invalid action. Use 'list' or 'read'" },
    { status: 400 }
  );
}
