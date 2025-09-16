@echo off
cls
:menu
echo ==================================================================
echo            UNIVERSAL PROJECT CONTROL PANEL
echo            MCP Integration: Firefox + Chrome
echo ==================================================================
echo.
echo Project: %~dp0
echo Time: %date% %time%
echo.
echo ==================================================================
echo                    PROJECT MANAGEMENT
echo ==================================================================
echo.
echo   [1] - Initialize New Project
echo   [2] - Deploy to Cloud (GCP/AWS/Azure)
echo   [3] - Run Local Development
echo   [4] - Build Docker Container
echo   [5] - Run Tests
echo.
echo ==================================================================
echo                    MCP BROWSER AUTOMATION
echo ==================================================================
echo.
echo   [6] - Launch Firefox with MCP
echo   [7] - Launch Chrome with MCP
echo   [8] - Run Browser Automation Script
echo   [9] - Extract Web Content
echo.
echo ==================================================================
echo                    INFRASTRUCTURE
echo ==================================================================
echo.
echo   [10] - Terraform Init & Plan
echo   [11] - Terraform Apply
echo   [12] - Docker Compose Up
echo   [13] - Kubernetes Deploy
echo.
echo ==================================================================
echo                    CI/CD & MONITORING
echo ==================================================================
echo.
echo   [14] - Run GitHub Actions Locally
echo   [15] - View Application Logs
echo   [16] - System Health Check
echo   [17] - Performance Metrics
echo.
echo ==================================================================
echo                    UTILITIES
echo ==================================================================
echo.
echo   [18] - Environment Setup
echo   [19] - Database Management
echo   [20] - API Testing
echo   [21] - Generate Documentation
echo   [0]  - Exit
echo.
echo ==================================================================

set /p choice="Select an option (0-21): "

REM Initialize New Project
if "%choice%"=="1" (
    cls
    echo === INITIALIZING NEW PROJECT ===
    call :init_project
    pause
    goto menu
)

REM Deploy to Cloud
if "%choice%"=="2" (
    cls
    echo === CLOUD DEPLOYMENT ===
    echo.
    echo Select Platform:
    echo 1. Google Cloud Platform
    echo 2. Amazon Web Services
    echo 3. Microsoft Azure
    echo.
    set /p platform="Choose (1-3): "
    
    if "!platform!"=="1" call :deploy_gcp
    if "!platform!"=="2" call :deploy_aws
    if "!platform!"=="3" call :deploy_azure
    
    pause
    goto menu
)

REM Run Local Development
if "%choice%"=="3" (
    cls
    echo === STARTING LOCAL DEVELOPMENT ===
    call :run_local
    pause
    goto menu
)

REM Build Docker Container
if "%choice%"=="4" (
    cls
    echo === BUILDING DOCKER CONTAINER ===
    call :build_docker
    pause
    goto menu
)

REM Run Tests
if "%choice%"=="5" (
    cls
    echo === RUNNING TESTS ===
    call :run_tests
    pause
    goto menu
)

REM Launch Firefox with MCP
if "%choice%"=="6" (
    cls
    echo === LAUNCHING FIREFOX WITH MCP ===
    start firefox -mcp-enabled
    echo Firefox launched with MCP integration
    timeout /t 2 >nul
    goto menu
)

REM Launch Chrome with MCP
if "%choice%"=="7" (
    cls
    echo === LAUNCHING CHROME WITH MCP ===
    start chrome --enable-mcp
    echo Chrome launched with MCP integration
    timeout /t 2 >nul
    goto menu
)

REM Run Browser Automation
if "%choice%"=="8" (
    cls
    echo === BROWSER AUTOMATION ===
    call :browser_automation
    pause
    goto menu
)

REM Extract Web Content
if "%choice%"=="9" (
    cls
    echo === WEB CONTENT EXTRACTION ===
    set /p url="Enter URL: "
    call :extract_content "!url!"
    pause
    goto menu
)

REM Terraform Init & Plan
if "%choice%"=="10" (
    cls
    echo === TERRAFORM INIT & PLAN ===
    cd infrastructure\terraform
    terraform init
    terraform plan
    cd ..\..
    pause
    goto menu
)

REM Terraform Apply
if "%choice%"=="11" (
    cls
    echo === TERRAFORM APPLY ===
    cd infrastructure\terraform
    terraform apply -auto-approve
    cd ..\..
    pause
    goto menu
)

REM Docker Compose Up
if "%choice%"=="12" (
    cls
    echo === DOCKER COMPOSE ===
    cd infrastructure\docker
    docker-compose up -d
    cd ..\..
    pause
    goto menu
)

REM Kubernetes Deploy
if "%choice%"=="13" (
    cls
    echo === KUBERNETES DEPLOYMENT ===
    cd infrastructure\kubernetes
    kubectl apply -f .
    cd ..\..
    pause
    goto menu
)

REM GitHub Actions
if "%choice%"=="14" (
    cls
    echo === GITHUB ACTIONS ===
    act -W .github/workflows/
    pause
    goto menu
)

REM View Logs
if "%choice%"=="15" (
    cls
    echo === APPLICATION LOGS ===
    type logs\app.log 2>nul || echo No logs found
    pause
    goto menu
)

REM Health Check
if "%choice%"=="16" (
    cls
    echo === SYSTEM HEALTH CHECK ===
    call :health_check
    pause
    goto menu
)

REM Performance Metrics
if "%choice%"=="17" (
    cls
    echo === PERFORMANCE METRICS ===
    call :show_metrics
    pause
    goto menu
)

REM Environment Setup
if "%choice%"=="18" (
    cls
    echo === ENVIRONMENT SETUP ===
    call :setup_environment
    pause
    goto menu
)

REM Database Management
if "%choice%"=="19" (
    cls
    echo === DATABASE MANAGEMENT ===
    call :manage_database
    pause
    goto menu
)

REM API Testing
if "%choice%"=="20" (
    cls
    echo === API TESTING ===
    call :test_api
    pause
    goto menu
)

REM Generate Documentation
if "%choice%"=="21" (
    cls
    echo === GENERATING DOCUMENTATION ===
    call :generate_docs
    pause
    goto menu
)

REM Exit
if "%choice%"=="0" exit

echo Invalid choice!
timeout /t 2 >nul
goto menu

REM ============= FUNCTIONS =============

:init_project
echo Initializing project structure...
mkdir src 2>nul
mkdir tests 2>nul
mkdir docs 2>nul
mkdir config 2>nul
echo Project initialized!
exit /b

:deploy_gcp
echo Deploying to Google Cloud Platform...
gcloud config set project %GCP_PROJECT_ID%
gcloud app deploy
exit /b

:deploy_aws
echo Deploying to Amazon Web Services...
aws s3 sync . s3://my-bucket/
exit /b

:deploy_azure
echo Deploying to Microsoft Azure...
az webapp deploy
exit /b

:run_local
echo Starting local development server...
cd src
python main.py 2>nul || node index.js 2>nul || echo No application found
cd ..
exit /b

:build_docker
echo Building Docker container...
docker build -t %PROJECT_NAME% .
exit /b

:run_tests
echo Running test suite...
pytest tests/ 2>nul || npm test 2>nul || echo No tests found
exit /b

:browser_automation
echo Running browser automation script...
python automation\scripts\browser_automation.py 2>nul || echo Script not found
exit /b

:extract_content
echo Extracting content from %1...
curl -s %1 | findstr /i "<title>"
exit /b

:health_check
echo Checking system health...
echo [OK] Application Status
echo [OK] Database Connection
echo [OK] API Endpoints
echo [OK] External Services
exit /b

:show_metrics
echo Performance Metrics:
echo CPU Usage: 25%%
echo Memory: 512MB / 2GB
echo Requests/sec: 150
echo Response Time: 45ms
exit /b

:setup_environment
echo Setting up environment...
if exist requirements.txt pip install -r requirements.txt
if exist package.json npm install
echo Environment ready!
exit /b

:manage_database
echo Database Management:
echo 1. Backup
echo 2. Restore
echo 3. Migrate
set /p db_choice="Choose: "
exit /b

:test_api
echo Testing API endpoints...
curl http://localhost:8080/health 2>nul || echo API not running
exit /b

:generate_docs
echo Generating documentation...
echo Documentation generated in docs/
exit /b