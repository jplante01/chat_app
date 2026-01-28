# Chat App

A real-time chat application built with modern web technologies, featuring instant messaging via WebSockets powered by Supabase Realtime.

## Features

- **Real-time Messaging** - Instant message delivery using Supabase Realtime WebSocket subscriptions
- **TypeScript** - Full type safety and enhanced developer experience
- **Responsive Design** - Seamless experience across desktop, tablet, and mobile devices
- **User Authentication** - Secure login and registration with Supabase Auth
- **Theme Support** - Light and dark mode with Material-UI theming
- **Conversation Management** - Create, view, and manage conversations with multiple participants

## Tech Stack

- **Frontend**: React 18, TypeScript, Material-UI, React Query
- **Backend**: Supabase (PostgreSQL Database, Authentication, Real-time subscriptions)
- **State Management**: React Query for server state, React hooks for local state
- **Styling**: Material-UI theme system with custom theming support
- **Build Tools**: Vite, TypeScript compiler

## Live Demo

[View Live Application](https://chat.jplante.dev)

# Getting Started

You are free to run the app yourself, or even deploy it! The instructions below should get you started.

## Prerequisites

- Node.js 18+ and npm
- Docker (required for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

## Setup

1. **Clone the repository**

   ```bash
   git clone git@github.com:jplante01/chat_app.git
   cd chat_app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the local Supabase stack**

   ```bash
   npx supabase start
   ```

   > [!NOTE]
   > The first time you start Supabase it will download Docker images, which can take some time. Subsequent starts will be faster.

4. **Seed the database with test users**

   ```bash
   npm run seed
   ```

5. **Start the frontend dev server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5173`

## Test Users (Local Development)

After running the seed script, the following test accounts are available:

| User    | Email             | Password    |
|---------|-------------------|-------------|
| Alice   | alice@test.com    | password123 |
| Bob     | bob@test.com      | password123 |
| Charlie | charlie@test.com  | password123 |

# Production/Deployment

Once you have the app running, you can build and deploy it.

## Production Build

### For Local Testing

```bash
npm run build
npm run preview
```

### For Deployment

#### Backend (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Link your local project to the remote:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```

3. Push your database schema:
   ```bash
   npx supabase db push
   ```

4. Create `.env.production` with your production Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

#### Frontend

5. **Build for production**

   ```bash
   npm run build
   ```

6. **Deploy the `dist/` folder** to your hosting platform

## Automated Front-End Deployment with AWS CLI

This project includes automated deployment of the front-end application to AWS S3 + CloudFront.

### Prerequisites

- AWS CLI installed and configured with appropriate permissions
- S3 bucket with static website hosting enabled
- CloudFront distribution pointing to your S3 bucket (optional but recommended)

### Setup

1. Copy the deployment environment template:
   ```bash
   cp deployment/.env.deploy.example deployment/.env.deploy
   ```

2. Fill in your AWS resource details in `deployment/.env.deploy`:
   - `S3_BUCKET_NAME`: Your S3 bucket name
   - `CLOUDFRONT_DISTRIBUTION_ID`: Found in AWS Console > CloudFront > Distributions
   - `CLOUDFRONT_URL`: Your CloudFront distribution URL or custom domain

### Deploy

```bash
cd deployment
./deploy.sh
```

The script will:

- Prompt for a deployment comment
- Build the application
- Upload files to S3 with optimized caching headers
- Invalidate CloudFront cache (if configured)
- Log the deployment with version and git commit information

Deployment logs are stored in `deployment/deployment.log` for audit purposes.

## Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run build` - Build for production
- `npm run preview` - Serve production build locally
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed the database with test users

### Supabase Commands

- `npx supabase start` - Start local Supabase instance
- `npx supabase stop` - Stop local Supabase instance
- `npx supabase status` - Check status of local services
- `npx supabase db reset` - Reset local database (reapplies migrations and seeds)

## Environment Configuration

- **Local development**: Uses `.env.development` (already configured for local Supabase)
- **Production**: Create `.env.production` with your Supabase project credentials
- **Local overrides**: Create `.env.development.local` if needed (gitignored)

## Local Supabase Ports

When running locally, Supabase services are available at:

| Service   | URL                              |
|-----------|----------------------------------|
| API       | http://127.0.0.1:54321           |
| Database  | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio    | http://127.0.0.1:54323           |
| Inbucket  | http://127.0.0.1:54324           |

## Troubleshooting

- **Supabase connection issues**: Make sure Supabase is running with `npx supabase start`
- **Port conflicts**: Check if ports 54321-54324 are available for Supabase
- **WebSocket issues**: Ensure your browser allows WebSocket connections
- **Build errors**: Clear `node_modules` and reinstall dependencies
