# Project Overview: loopjs

This project is a full-stack JavaScript application designed for Windows System Management. It consists of a Node.js backend, a React/TypeScript frontend, and uses MongoDB as its database, all orchestrated with Docker Compose.

## Architecture

*   **Backend:** Developed with Node.js, Express.js for routing, Mongoose for MongoDB object modeling, Passport.js for authentication, and WebSockets for real-time communication.
*   **Frontend:** Built using React with TypeScript, styled with Tailwind CSS, and bundled with Vite.
*   **Database:** MongoDB, managed as a Docker service.
*   **Containerization:** Docker Compose is used to define and run the multi-container Docker application.

## Building and Running

The project can be built and run using Docker Compose, which will set up both the backend, frontend, and MongoDB services.

### Prerequisites

*   Docker and Docker Compose installed.
*   Node.js and npm (or yarn) if you plan to run services outside of Docker or for development within the containers.

### Running with Docker Compose

1.  **Build and Start Services:**
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker images for the backend and frontend (if they haven't been built or if their Dockerfiles have changed) and then start all services defined in `docker-compose.yml`.

2.  **Accessing the Application:**
    *   **Frontend:** Accessible in your web browser at `http://localhost` (or `http://localhost:80` if port 80 is already in use, Docker will map to an available port).
    *   **Backend API:** The backend API will be available at `http://localhost:3001`.

### Development Commands (within respective directories)

#### Backend (`backend/`)

*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Start Development Server (with nodemon):**
    ```bash
    npm run dev
    ```
*   **Start Production Server:**
    ```bash
    npm start
    ```

#### Frontend (`frontend/`)

*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Start Development Server (with Vite):**
    ```bash
    npm run dev
    ```
    The frontend development server typically runs on `http://localhost:5173`.

*   **Build for Production:**
    ```bash
    npm run build
    ```
    This will create a `dist` directory with the production-ready static files.

## Development Conventions

*   **Language:** JavaScript (Node.js) for backend, TypeScript for frontend.
*   **Styling:** Tailwind CSS for frontend styling.
*   **Authentication:** Passport.js is used for local authentication on the backend.
*   **Real-time Communication:** WebSockets are utilized for real-time updates between the backend and frontend.
*   **API Interaction:** The frontend uses `axios` for making HTTP requests to the backend API.
