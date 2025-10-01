# LoopJS

A modern client-server application for remote system management.

## Architecture

- **Backend**: Node.js server with Express and WebSockets
- **Frontend**: React web application
- **Clients**: Multiple desktop client implementations

## Development

### Prerequisites
- Node.js
- Docker
- Google Cloud SDK
- CMake (for clients)
- Qt (for Qt client)

### Setup
1. Clone the repository
2. Set up environment variables
3. Install dependencies in both frontend and backend directories
4. Build the appropriate client for your platform

### Deployment
The project uses GitHub Actions for CI/CD, automatically deploying to Google Cloud Run when changes are pushed to the main branch.

## Structure
- `frontend/`: React web application
- `backend/`: Node.js server
- `clients/`: Desktop client implementations
  - `qt-client/`: Qt-based desktop application
  - `stealth-client/`: Advanced client with stealth features

## Deployment Guide

See the [Quick Fix Guide](./docs/QUICK_FIX_GUIDE.md) for a quick way to get your deployment working, or the [Deployment Setup](./docs/DEPLOYMENT_SETUP.md) for more comprehensive instructions.

## License
MIT
