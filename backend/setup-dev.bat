@echo off
echo ========================================
echo LoopJS Backend - Development Setup
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo [2/4] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)
echo ✓ npm is installed

echo.
echo [3/4] Installing dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo ✓ Dependencies already installed
)

echo.
echo [4/4] Setting up environment...
if not exist ".env" (
    echo Creating .env file...
    echo # Server Configuration > .env
    echo PORT=8080 >> .env
    echo NODE_ENV=development >> .env
    echo. >> .env
    echo # Database Configuration (optional) >> .env
    echo # MONGODB_URI=mongodb://localhost:27017/loopjs-dev >> .env
    echo. >> .env
    echo # JWT Configuration >> .env
    echo JWT_SECRET=dev-secret-key-change-in-production >> .env
    echo JWT_EXPIRES_IN=7d >> .env
    echo ✓ .env file created
) else (
    echo ✓ .env file already exists
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the development server:
echo   npm run dev
echo.
echo To start the production server:
echo   npm start
echo.
echo Note: The application will run without MongoDB if not configured.
echo See MONGODB_SETUP.md for database configuration options.
echo.
pause

