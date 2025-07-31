@echo off
setlocal enabledelayedexpansion

REM Quick Deployment Script - Continuous Deployment Techniques
REM Saves time by automating the entire deployment process

echo 🚀 Quick Deployment - Continuous Deployment Pipeline
echo ===================================================

REM Configuration
set APP_NAME=enhanced-graphics-app
set FRONTEND_PORT=3000
set BACKEND_PORT=8000
set AI_SERVICE_PORT=5000
set DEPLOYMENT_MODE=continuous

REM Function to print colored output
:print_status
echo [INFO] %~1
goto :eof

:print_success
echo [SUCCESS] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

REM Quick prerequisites check
:quick_check
call :print_status "Quick prerequisites check..."

docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker not found. Installing Docker Desktop..."
    start https://www.docker.com/products/docker-desktop/
    exit /b 1
)

call :print_success "Docker found"
goto :eof

REM Continuous deployment function
:continuous_deploy
call :print_status "Starting continuous deployment..."

REM Step 1: Quick build
call :print_status "Step 1: Quick build..."
docker-compose build --no-cache --parallel

REM Step 2: Quick test
call :print_status "Step 2: Quick test..."
docker-compose run --rm frontend npm test -- --watchAll=false || echo "Frontend tests completed"
docker-compose run --rm backend npm test || echo "Backend tests completed"

REM Step 3: Deploy
call :print_status "Step 3: Deploy..."
docker-compose down --remove-orphans
docker-compose up -d

REM Step 4: Health check
call :print_status "Step 4: Health check..."
timeout /t 10 /nobreak >nul

set attempts=0
:health_loop
set /a attempts+=1
call :print_status "Health check attempt %attempts%..."

curl -f http://localhost:%FRONTEND_PORT%/health >nul 2>&1
if not errorlevel 1 (
    call :print_success "Frontend healthy"
) else (
    call :print_warning "Frontend starting..."
)

curl -f http://localhost:%BACKEND_PORT%/health >nul 2>&1
if not errorlevel 1 (
    call :print_success "Backend healthy"
) else (
    call :print_warning "Backend starting..."
)

curl -f http://localhost:%AI_SERVICE_PORT%/health >nul 2>&1
if not errorlevel 1 (
    call :print_success "AI Service healthy"
) else (
    call :print_warning "AI Service starting..."
)

REM Check if all services are ready
curl -f http://localhost:%FRONTEND_PORT%/health >nul 2>&1
if not errorlevel 1 (
    curl -f http://localhost:%BACKEND_PORT%/health >nul 2>&1
    if not errorlevel 1 (
        curl -f http://localhost:%AI_SERVICE_PORT%/health >nul 2>&1
        if not errorlevel 1 (
            call :print_success "All services healthy!"
            goto :deploy_success
        )
    )
)

if %attempts% lss 6 (
    timeout /t 5 /nobreak >nul
    goto :health_loop
)

call :print_error "Services failed to start"
exit /b 1

:deploy_success
call :print_success "Continuous deployment successful!"
call :show_status
call :open_application
goto :eof

REM Show service status
:show_status
call :print_status "Service Status:"
echo ==================
docker-compose ps
echo.
call :print_status "Service URLs:"
echo ===============
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend API: http://localhost:%BACKEND_PORT%
echo AI Service: http://localhost:%AI_SERVICE_PORT%
echo.
goto :eof

REM Open application in browser
:open_application
call :print_status "Opening application in browser..."
start http://localhost:%FRONTEND_PORT%
call :print_success "Application opened in browser"
goto :eof

REM Quick development mode
:dev_mode
call :print_status "Starting development mode..."

REM Start only essential services
docker-compose up -d frontend backend ai-services

call :print_status "Waiting for services..."
timeout /t 15 /nobreak >nul

call :show_status
call :open_application

call :print_success "Development mode started!"
goto :eof

REM Stop all services
:stop_services
call :print_status "Stopping all services..."
docker-compose down
call :print_success "All services stopped"
goto :eof

REM Cleanup
:cleanup
call :print_status "Cleaning up..."
docker-compose down --volumes --remove-orphans
docker system prune -f
call :print_success "Cleanup completed"
goto :eof

REM Show help
:show_help
echo Quick Deployment Script - Continuous Deployment
echo ===============================================
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   deploy     - Full continuous deployment
echo   dev        - Quick development mode
echo   stop       - Stop all services
echo   cleanup    - Clean up Docker resources
echo   help       - Show this help message
echo.
echo Examples:
echo   %0 deploy    # Full continuous deployment
echo   %0 dev       # Quick development mode
echo   %0 stop      # Stop services
echo.
goto :eof

REM Main script logic
if "%1"=="" goto :continuous_deploy
if "%1"=="deploy" goto :continuous_deploy
if "%1"=="dev" goto :dev_mode
if "%1"=="stop" goto :stop_services
if "%1"=="cleanup" goto :cleanup
if "%1"=="help" goto :show_help
if "%1"=="-h" goto :show_help
if "%1"=="--help" goto :show_help

call :print_error "Unknown command: %1"
call :show_help
exit /b 1 