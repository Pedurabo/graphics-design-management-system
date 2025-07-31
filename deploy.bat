@echo off
setlocal enabledelayedexpansion

REM Enhanced Graphics Application - Quick Deployment Script for Windows
REM Uses Jenkins-style CI/CD techniques for rapid deployment

echo 🚀 Starting Enhanced Graphics Application Deployment...

REM Configuration
set APP_NAME=enhanced-graphics-app
set DOCKER_COMPOSE_FILE=docker-compose.yml
set FRONTEND_PORT=3000
set BACKEND_PORT=8000
set AI_SERVICE_PORT=5000

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

REM Check prerequisites
:check_prerequisites
call :print_status "Checking prerequisites..."

docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not installed. Please install Docker Desktop first."
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    call :print_warning "Node.js is not installed. Some features may not work."
)

python --version >nul 2>&1
if errorlevel 1 (
    call :print_warning "Python is not installed. AI services may not work."
)

call :print_success "Prerequisites check completed"
goto :eof

REM Stop existing containers
:stop_containers
call :print_status "Stopping existing containers..."
docker-compose -f %DOCKER_COMPOSE_FILE% down --remove-orphans >nul 2>&1
call :print_success "Existing containers stopped"
goto :eof

REM Build and start services
:build_and_start
call :print_status "Building and starting services..."

REM Build images
docker-compose -f %DOCKER_COMPOSE_FILE% build --no-cache

REM Start services
docker-compose -f %DOCKER_COMPOSE_FILE% up -d

call :print_success "Services built and started"
goto :eof

REM Wait for services to be ready
:wait_for_services
call :print_status "Waiting for services to be ready..."

set max_attempts=30
set attempt=1

:wait_loop
call :print_status "Attempt %attempt%/%max_attempts% - Checking services..."

REM Check frontend
curl -f http://localhost:%FRONTEND_PORT%/health >nul 2>&1
if errorlevel 1 (
    call :print_warning "Frontend not ready yet"
) else (
    call :print_success "Frontend is ready"
)

REM Check backend
curl -f http://localhost:%BACKEND_PORT%/health >nul 2>&1
if errorlevel 1 (
    call :print_warning "Backend not ready yet"
) else (
    call :print_success "Backend is ready"
)

REM Check AI service
curl -f http://localhost:%AI_SERVICE_PORT%/health >nul 2>&1
if errorlevel 1 (
    call :print_warning "AI Service not ready yet"
) else (
    call :print_success "AI Service is ready"
)

REM If all services are ready, break
curl -f http://localhost:%FRONTEND_PORT%/health >nul 2>&1
if not errorlevel 1 (
    curl -f http://localhost:%BACKEND_PORT%/health >nul 2>&1
    if not errorlevel 1 (
        curl -f http://localhost:%AI_SERVICE_PORT%/health >nul 2>&1
        if not errorlevel 1 (
            call :print_success "All services are ready!"
            goto :wait_done
        )
    )
)

timeout /t 5 /nobreak >nul
set /a attempt+=1
if %attempt% leq %max_attempts% goto :wait_loop

call :print_error "Services failed to start within expected time"
exit /b 1

:wait_done
goto :eof

REM Run health checks
:health_check
call :print_status "Running health checks..."

REM Check frontend
curl -f http://localhost:%FRONTEND_PORT%/health >nul 2>&1
if errorlevel 1 (
    call :print_error "Frontend health check failed"
    exit /b 1
) else (
    call :print_success "Frontend health check passed"
)

REM Check backend
curl -f http://localhost:%BACKEND_PORT%/health >nul 2>&1
if errorlevel 1 (
    call :print_error "Backend health check failed"
    exit /b 1
) else (
    call :print_success "Backend health check passed"
)

REM Check AI service
curl -f http://localhost:%AI_SERVICE_PORT%/health >nul 2>&1
if errorlevel 1 (
    call :print_error "AI Service health check failed"
    exit /b 1
) else (
    call :print_success "AI Service health check passed"
)

call :print_success "All health checks passed"
goto :eof

REM Open application in browser
:open_application
call :print_status "Opening application in browser..."
start http://localhost:%FRONTEND_PORT%
call :print_success "Application opened in browser"
goto :eof

REM Show service status
:show_status
call :print_status "Service Status:"
echo ==================
docker-compose -f %DOCKER_COMPOSE_FILE% ps
echo.
call :print_status "Service URLs:"
echo ===============
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend API: http://localhost:%BACKEND_PORT%
echo AI Service: http://localhost:%AI_SERVICE_PORT%
echo Grafana Dashboard: http://localhost:3001
echo Prometheus: http://localhost:9090
echo.
goto :eof

REM Main deployment function
:deploy
call :print_status "Starting deployment process..."

call :check_prerequisites
if errorlevel 1 exit /b 1

call :stop_containers
call :build_and_start
call :wait_for_services
if errorlevel 1 exit /b 1

call :health_check
if errorlevel 1 exit /b 1

call :show_status
call :open_application

call :print_success "🎉 Deployment completed successfully!"
call :print_status "Your enhanced graphics application with medical features is now running!"
goto :eof

REM Quick start function (for development)
:quick_start
call :print_status "Starting quick development mode..."

REM Start only essential services
docker-compose -f %DOCKER_COMPOSE_FILE% up -d frontend backend ai-services

call :wait_for_services
if errorlevel 1 exit /b 1

call :show_status
call :open_application

call :print_success "🚀 Quick start completed!"
goto :eof

REM Stop function
:stop
call :print_status "Stopping all services..."
docker-compose -f %DOCKER_COMPOSE_FILE% down
call :print_success "All services stopped"
goto :eof

REM Logs function
:logs
call :print_status "Showing service logs..."
docker-compose -f %DOCKER_COMPOSE_FILE% logs -f
goto :eof

REM Cleanup function
:cleanup
call :print_status "Cleaning up Docker resources..."
docker-compose -f %DOCKER_COMPOSE_FILE% down --volumes --remove-orphans
docker system prune -f
call :print_success "Cleanup completed"
goto :eof

REM Show help
:show_help
echo Enhanced Graphics Application Deployment Script
echo ==============================================
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   deploy     - Full deployment with all services
echo   quick      - Quick start for development
echo   stop       - Stop all services
echo   logs       - Show service logs
echo   cleanup    - Clean up Docker resources
echo   help       - Show this help message
echo.
echo Examples:
echo   %0 deploy    # Full deployment
echo   %0 quick     # Quick development start
echo   %0 stop      # Stop services
echo.
goto :eof

REM Main script logic
if "%1"=="" goto :deploy
if "%1"=="deploy" goto :deploy
if "%1"=="quick" goto :quick_start
if "%1"=="stop" goto :stop
if "%1"=="logs" goto :logs
if "%1"=="cleanup" goto :cleanup
if "%1"=="help" goto :show_help
if "%1"=="-h" goto :show_help
if "%1"=="--help" goto :show_help

call :print_error "Unknown command: %1"
call :show_help
exit /b 1 