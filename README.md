# LoopJS

A modern client-server application for remote system management.

## Architecture

- **Backend**: Node.js server with Express and WebSockets
- **Frontend**: React web application
- **Client**: Desktop application for Windows

## Development

### Prerequisites
- Node.js
- Docker
- Google Cloud SDK

### Setup
1. Clone the repository
2. Set up environment variables
3. Install dependencies in both frontend and backend directories

### Deployment
The project uses GitHub Actions for CI/CD, automatically deploying to Google Cloud Run when changes are pushed to the main branch.

## Structure
- `frontend/`: React web application
- `backend/`: Node.js server
- `client/`: Desktop application (to be added)

## License
MIT
