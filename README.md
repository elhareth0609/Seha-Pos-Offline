# Midgram Pharmacy Management System

A comprehensive pharmacy management system for sales, inventory, and purchases.

## Prerequisites

- Node.js (version 20 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Seha-Pos-Offline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file to configure your API URL:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:9002`

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Electron Desktop Application

### Development Mode

```bash
npm run electron:dev
```

### Production Build

```bash
npm run electron:build
```

## Features

- Sales management
- Inventory tracking
- Purchase management
- Patient records
- Comprehensive reporting
- Offline capability

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Electron (for desktop application)
