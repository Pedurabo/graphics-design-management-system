@echo off
setlocal enabledelayedexpansion

REM Graphics Design Management System Setup Script for Windows
REM This script sets up the entire application with all components

echo ==========================================
echo Graphics Design Management System Setup
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop and run this script again.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose and run this script again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js and run this script again.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python and run this script again.
    pause
    exit /b 1
)

echo [INFO] All prerequisites are installed

REM Create environment files
echo [INFO] Creating environment files...

REM Frontend environment
echo REACT_APP_API_URL=http://localhost:8000> frontend\.env
echo REACT_APP_AI_SERVICE_URL=http://localhost:8001>> frontend\.env
echo REACT_APP_WS_URL=ws://localhost:8000>> frontend\.env
echo REACT_APP_ENVIRONMENT=development>> frontend\.env

REM Backend environment
echo NODE_ENV=development> backend\.env
echo PORT=8000>> backend\.env
echo DATABASE_URL=postgresql://postgres:password@localhost:5432/graphics_design_db>> backend\.env
echo REDIS_URL=redis://localhost:6379>> backend\.env
echo JWT_SECRET=your-super-secret-jwt-key-change-in-production>> backend\.env
echo AI_SERVICE_URL=http://localhost:8001>> backend\.env
echo ELASTICSEARCH_URL=http://localhost:9200>> backend\.env
echo MONGODB_URL=mongodb://localhost:27017/graphics_design>> backend\.env
echo FRONTEND_URL=http://localhost:3000>> backend\.env
echo CORS_ORIGIN=http://localhost:3000>> backend\.env

REM AI Services environment
echo ENVIRONMENT=development> ai-services\.env
echo MODEL_PATH=/app/models>> ai-services\.env
echo GPU_ENABLED=false>> ai-services\.env
echo DATABASE_URL=postgresql://postgres:password@localhost:5432/graphics_design_db>> ai-services\.env
echo REDIS_URL=redis://localhost:6379>> ai-services\.env
echo ELASTICSEARCH_URL=http://localhost:9200>> ai-services\.env
echo BACKEND_URL=http://localhost:8000>> ai-services\.env
echo ALLOWED_ORIGINS=["http://localhost:3000"]>> ai-services\.env
echo ALLOWED_HOSTS=["localhost", "127.0.0.1"]>> ai-services\.env

echo [SUCCESS] Environment files created

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
if not exist node_modules (
    npm install
) else (
    npm install --silent
)
cd ..

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
if not exist node_modules (
    npm install
) else (
    npm install --silent
)
cd ..

REM Install AI services dependencies
echo [INFO] Installing AI services dependencies...
cd ai-services
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
call venv\Scripts\deactivate.bat
cd ..

REM Start services with Docker Compose
echo [INFO] Starting services with Docker Compose...
docker-compose up -d

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo [ERROR] Some services failed to start
    docker-compose logs
    pause
    exit /b 1
)

echo [SUCCESS] All services are running

REM Build frontend
echo [INFO] Building frontend application...
cd frontend
npm run build
cd ..

echo [SUCCESS] Setup completed successfully!
echo.
echo Service URLs:
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo AI Services: http://localhost:8001
echo Grafana: http://localhost:3001 ^(admin/admin^)
echo Prometheus: http://localhost:9090
echo Kibana: http://localhost:5601
echo SonarQube: http://localhost:9000
echo Vault: http://localhost:8200
echo.
echo Default admin credentials:
echo Email: admin@graphicsdesign.com
echo Password: admin123
echo.
echo To stop all services: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause 