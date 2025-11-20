# AI Judge Platform

An automated evaluation system for reviewing submissions using AI judges powered by Large Language Models.

## 📋 Project Overview

This platform allows users to:
- Upload submissions with questions and answers
- Create and manage AI judges with custom prompts
- Assign judges to specific questions in queues
- Run automated evaluations using LLM providers (OpenAI)
- View results with filtering and statistics

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with better-sqlite3 (synchronous, file-based)
- **LLM Provider**: OpenAI API

### Directory Structure
```
ai-judge-platform/
├── server/                    # Backend API
│   ├── src/
│   │   ├── models/           # TypeScript interfaces & database schema
│   │   ├── repositories/     # Data access layer (DAOs)
│   │   ├── services/         # Business logic & external services
│   │   ├── routes/           # Express route handlers
│   │   ├── utils/            # Helper functions
│   │   └── index.ts          # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── client/                    # Frontend (to be created)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── package.json              # Root package (runs both)
```

## 📊 Database Schema

### Tables

#### 1. **submissions**
Stores uploaded submission records
- `id` (TEXT, PRIMARY KEY)
- `queue_id` (TEXT)
- `labeling_task_id` (TEXT)
- `created_at` (INTEGER, ms since epoch)

**Indices**: `queue_id`, `created_at`, composite `(queue_id, created_at)`

#### 2. **questions**
Unique questions per queue
- `id` (TEXT)
- `queue_id` (TEXT)
- `question_text` (TEXT)
- `question_type` (TEXT)
- `rev` (INTEGER, nullable)
- `created_at` (INTEGER)

**Primary Key**: `(id, queue_id)`  
**Indices**: `queue_id`, `question_type`

#### 3. **answers**
User answers to questions in submissions
- `id` (INTEGER, AUTO-INCREMENT)
- `submission_id` (TEXT, FK → submissions)
- `question_id` (TEXT)
- `choice` (TEXT, nullable)
- `reasoning` (TEXT, nullable)
- `raw_json` (TEXT)
- `created_at` (INTEGER)

**Indices**: `submission_id`, `question_id`, composite `(submission_id, question_id)`

#### 4. **judges**
AI judge configurations
- `id` (INTEGER, AUTO-INCREMENT)
- `name` (TEXT, UNIQUE)
- `system_prompt` (TEXT)
- `model` (TEXT)
- `active` (INTEGER, 0/1)
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

**Indices**: `active`, `name`

#### 5. **question_judges**
Assignment of judges to questions in queues
- `id` (INTEGER, AUTO-INCREMENT)
- `queue_id` (TEXT)
- `question_id` (TEXT)
- `judge_id` (INTEGER, FK → judges)
- `created_at` (INTEGER)

**Unique Constraint**: `(queue_id, question_id, judge_id)`  
**Indices**: `queue_id`, `question_id`, `judge_id`, composite `(queue_id, question_id)`

#### 6. **evaluations**
AI judge evaluation results
- `id` (INTEGER, AUTO-INCREMENT)
- `submission_id` (TEXT, FK → submissions)
- `question_id` (TEXT)
- `judge_id` (INTEGER, FK → judges)
- `verdict` (TEXT, CHECK: 'pass'|'fail'|'inconclusive')
- `reasoning` (TEXT)
- `raw_response` (TEXT)
- `created_at` (INTEGER)

**Unique Constraint**: `(submission_id, question_id, judge_id)`  
**Indices**: Multiple for filtering by submission, question, judge, verdict, and composites

## 🎯 Separation of Concerns

### Models Layer (`models/`)
- Pure TypeScript interfaces
- Database row types with snake_case
- Application types with camelCase
- Input/output DTOs
- Database schema definition

### Services Layer (`services/`)
- Database connection management
- External API clients (OpenAI)
- Business logic
- Utility functions (case conversion)

### Repository Layer (`repositories/`)
- Data access objects (DAOs)
- CRUD operations
- Query builders
- Transaction management

### Routes Layer (`routes/`)
- HTTP request handlers
- Request validation
- Response formatting
- Error handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Install all dependencies**:
```bash
npm run install:all
```

Or manually:
```bash
# Root
npm install

# Server
cd server
npm install

# Client (when created)
cd ../client
npm install
```

2. **Set up environment variables**:
```bash
cd server
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. **Run the development servers**:
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on `http://localhost:4000`
- Frontend on `http://localhost:5173` (when client is set up)

## 📝 Design Decisions

### Why SQLite?
- **Zero infrastructure**: No external database server needed
- **Portable**: Single file, easy to backup/share
- **Fast**: In-process, synchronous operations
- **Good enough**: Handles concurrent reads well with WAL mode
- **Trade-off**: Not suitable for high-concurrency production, but perfect for this take-home

### Why better-sqlite3?
- **Synchronous API**: Simpler code, no async/await overhead for DB ops
- **Performance**: Faster than async alternatives for this use case
- **Type-safe**: Good TypeScript support

### Why Express?
- **Familiar**: Industry standard, well-documented
- **Simple**: Minimal boilerplate for REST APIs
- **Flexible**: Easy to add middleware as needed

### Index Strategy
- Indexed all foreign keys
- Added composite indices for common query patterns
- Covered filtering columns (verdict, judge_id, question_id)
- Optimized for the results page queries

## 🔄 Data Flow

1. **Upload**: JSON → Parse → Repositories → SQLite
2. **Judge CRUD**: UI → API → Repository → SQLite
3. **Assignment**: UI → API → Repository → SQLite (bulk replace)
4. **Evaluation**: 
   - Trigger → Fetch assignments → For each (submission × question × judge)
   - → Call OpenAI → Parse verdict → Store evaluation
5. **Results**: Fetch evaluations → Apply filters → Compute stats → Display

## ⏱️ Time Spent
- Planning & architecture: TBD
- Models & schema: ~1 hour
- Backend services: TBD
- Frontend: TBD
- Testing & polish: TBD

**Total**: TBD hours

## 🎬 Next Steps

1. Create repository layer (DAOs)
2. Set up Express server with routes
3. Initialize Vite React frontend
4. Implement upload functionality
5. Build judges CRUD UI
6. Create assignment interface
7. Implement evaluation runner
8. Build results view with filters

## 📄 License
MIT
