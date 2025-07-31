# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a movie data crawler supporting multiple sources: CSFD (Czech film database) and TMDB (The Movie Database). The project uses Crawlee for web scraping, Prisma for database operations, and follows a clean architecture pattern.

## Key Architecture

- **Database**: PostgreSQL with Prisma ORM (SQLite for local development)
  - Generated client in `generated/prisma/`
  - **CRITICAL**: Provider is set to "postgresql" - NEVER change this to any other provider
  - Production deployments use PostgreSQL exclusively
  - Comprehensive schema with Content, Person, Cast, Crew, Video, Gallery, Award, etc.
  - Supports hierarchical relationships (series/seasons/episodes via parent/child)
  - Multi-source support via `remoteSource` field
  - Proper person management with separate Cast/Crew relationships
  - Enhanced metadata fields for both CSFD and TMDB

- **Project Structure**:
  ```
  src/
    ├── shared/           # Shared code across all crawlers
    │   ├── interfaces/   # TypeScript interfaces
    │   ├── services/     # Database and queue services
    │   └── utils/        # Utility functions
    ├── crawlers/         # Crawler implementations
    │   ├── csfd/         # CSFD crawler
    │   └── tmdb/         # TMDB crawler
    └── types/            # Type definitions
  ```

- **Data Flow**:
  1. Crawler-specific authentication (CSFD: Playwright, TMDB: API key)
  2. Fetch and parse data from respective sources
  3. Transform to common interface format
  4. Save to database using shared services

## Development Commands

```bash
# Install dependencies
npm install

# Database operations
npm run db:migrate        # Apply migrations
npm run db:generate       # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:reset         # Reset database
npm run db:studio        # Open Prisma Studio

# Development (with hot reload)
npm run dev:csfd         # Run CSFD crawler in development
npm run dev:tmdb         # Run TMDB crawler in development
npm run dev:tmdb:movie   # Run TMDB movie crawler with ID
npm run dev:tmdb:series  # Run TMDB series crawler with ID

# Production builds
npm run build            # Build TypeScript to dist/
npm run clean:build      # Clean and build
npm run start:csfd       # Build and run CSFD crawler
npm run start:tmdb       # Build and run TMDB crawler
npm run start:tmdb:movie # Build and run TMDB movie crawler
npm run start:tmdb:series # Build and run TMDB series crawler

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

## Important Configuration

- **Environment Variables**: 
  - `CSFD_EMAIL` and `CSFD_PASSWORD` for CSFD authentication
  - `TMDB_API_KEY` for TMDB API authentication
  - `DATABASE_URL` for database connection (PostgreSQL connection string in production)
  - `DATABASE_PROVIDER` is set to "postgresql" in Docker containers

- **Rate Limiting**: 
  - CSFD: Uses maxConcurrency: 1 to avoid blocking
  - TMDB: 250ms delay between API requests
- **Authentication**: 
  - CSFD: Uses Playwright for login, then maintains cookies via middleware
  - TMDB: Uses Bearer token authentication via API key

## Database Schema Notes

- **IMPORTANT**: The Prisma schema provider is set to "postgresql" and must NEVER be changed
- **Content Model**: Unified model for movies, series, seasons, and episodes
- **Person Model**: Separate model for actors, directors, writers, etc.
- **Cast/Crew Models**: Proper relationship models linking Content and Person
- **Hierarchical Support**: Parent-child relationships for series → seasons → episodes
- **Multi-source Support**: `remoteId` + `remoteSource` creates unique identifiers
- **Rich Metadata**: Enhanced fields for ratings, popularity, release dates, etc.
- **Cross-referencing**: ContentMapping for linking same content across sources
- **Database Provider**: PostgreSQL is the only supported provider in production

## Shared Services

- **DatabaseService**: Unified database operations for all crawlers
- **QueueService**: Request queue management with retry logic
- **HttpUtil**: HTTP request utilities with retry and rate limiting

## TypeScript Configuration

- Target: ES2020
- Output directory: `dist/`
- Root directory: `src/`
- Includes type definitions and source maps
- Strict mode enabled
- Never edit compiled or generated files in `dist/` or `generated/` manually.
- Always use the `npm run` commands to build and run the project.