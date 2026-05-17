# portfolio

This repository is the portfolio site of OBN (Open Build Network).

## Setup & Running

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies

Install the required packages using npm:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory of the project and add the following configuration variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the Development Server

Start a local development server with live-reloading:

```bash
npm run dev
```

The app will typically be accessible at `http://localhost:5173`.

### 4. Build for Production

To create an optimized production build:

```bash
npm run build
```

This will output the compiled assets into the `dist/` directory.
