@echo off
setlocal enabledelayedexpansion

REM Graphics Design Management System - Automation Script (Windows)
REM This script automates the development, testing, and deployment workflow

set PROJECT_ROOT=%~dp0..
set FRONTEND_DIR=%PROJECT_ROOT%\frontend
set BACKEND_DIR=%PROJECT_ROOT%\backend
set AI_SERVICES_DIR=%PROJECT_ROOT%\ai-services
set DOCKER_COMPOSE_FILE=%PROJECT_ROOT%\docker-compose.yml

REM Colors for output (Windows 10+)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

REM Logging function
:log
echo %BLUE%[%date% %time%]%NC% %~1
goto :eof

:success
echo %GREEN%✅ %~1%NC%
goto :eof

:warning
echo %YELLOW%⚠️  %~1%NC%
goto :eof

:error
echo %RED%❌ %~1%NC%
goto :eof

REM Check if command exists
:command_exists
where %~1 >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Check prerequisites
:check_prerequisites
call :log "Checking prerequisites..."

set missing_deps=

call :command_exists node
if %errorlevel% neq 0 set missing_deps=%missing_deps% Node.js

call :command_exists npm
if %errorlevel% neq 0 set missing_deps=%missing_deps% npm

call :command_exists python
if %errorlevel% neq 0 set missing_deps=%missing_deps% Python

call :command_exists docker
if %errorlevel% neq 0 set missing_deps=%missing_deps% Docker

if not "%missing_deps%"=="" (
    call :error "Missing dependencies: %missing_deps%"
    call :error "Please install the missing dependencies and try again."
    exit /b 1
)

call :success "All prerequisites are installed"
goto :eof

REM Install dependencies
:install_dependencies
call :log "Installing dependencies..."

REM Install root dependencies
cd /d "%PROJECT_ROOT%"
call npm install
if %errorlevel% neq 0 (
    call :error "Failed to install root dependencies"
    exit /b 1
)

REM Install frontend dependencies
cd /d "%FRONTEND_DIR%"
call npm install
if %errorlevel% neq 0 (
    call :error "Failed to install frontend dependencies"
    exit /b 1
)

REM Install backend dependencies
cd /d "%BACKEND_DIR%"
call npm install
if %errorlevel% neq 0 (
    call :error "Failed to install backend dependencies"
    exit /b 1
)

REM Install AI services dependencies
cd /d "%AI_SERVICES_DIR%"
if exist "requirements.txt" (
    call pip install -r requirements.txt
    if %errorlevel% neq 0 (
        call :error "Failed to install AI services dependencies"
        exit /b 1
    )
)

call :success "Dependencies installed successfully"
goto :eof

REM Run linting
:run_lint
call :log "Running linting..."

set lint_errors=0

REM Frontend linting
cd /d "%FRONTEND_DIR%"
call npm run lint
if %errorlevel% neq 0 (
    call :error "Frontend linting failed"
    set /a lint_errors+=1
) else (
    call :success "Frontend linting passed"
)

REM Backend linting
cd /d "%BACKEND_DIR%"
call npm run lint
if %errorlevel% neq 0 (
    call :error "Backend linting failed"
    set /a lint_errors+=1
) else (
    call :success "Backend linting passed"
)

if %lint_errors% equ 0 (
    call :success "All linting checks passed"
) else (
    call :error "%lint_errors% linting check(s) failed"
    exit /b 1
)
goto :eof

REM Run tests
:run_tests
call :log "Running tests..."

set test_errors=0

REM Frontend tests
cd /d "%FRONTEND_DIR%"
call npm test -- --watchAll=false --coverage
if %errorlevel% neq 0 (
    call :error "Frontend tests failed"
    set /a test_errors+=1
) else (
    call :success "Frontend tests passed"
)

REM Backend tests
cd /d "%BACKEND_DIR%"
call npm test
if %errorlevel% neq 0 (
    call :error "Backend tests failed"
    set /a test_errors+=1
) else (
    call :success "Backend tests passed"
)

REM AI services tests
cd /d "%AI_SERVICES_DIR%"
call python -m pytest tests/ -v --cov=services --cov-report=html
if %errorlevel% neq 0 (
    call :error "AI services tests failed"
    set /a test_errors+=1
) else (
    call :success "AI services tests passed"
)

if %test_errors% equ 0 (
    call :success "All tests passed"
) else (
    call :error "%test_errors% test suite(s) failed"
    exit /b 1
)
goto :eof

REM Run E2E tests
:run_e2e_tests
call :log "Running E2E tests..."

REM Start the application for E2E testing
call :start_services

REM Wait for services to be ready
timeout /t 30 /nobreak >nul

REM Run Cypress tests
cd /d "%FRONTEND_DIR%"
call npm run test:e2e
if %errorlevel% neq 0 (
    call :error "E2E tests failed"
    call :stop_services
    exit /b 1
)

call :success "E2E tests passed"
call :stop_services
goto :eof

REM Build application
:build_application
call :log "Building application..."

REM Build frontend
cd /d "%FRONTEND_DIR%"
call npm run build
if %errorlevel% neq 0 (
    call :error "Frontend build failed"
    exit /b 1
)
call :success "Frontend built successfully"

REM Build backend
cd /d "%BACKEND_DIR%"
call npm run build
if %errorlevel% neq 0 (
    call :error "Backend build failed"
    exit /b 1
)
call :success "Backend built successfully"

call :success "Application built successfully"
goto :eof

REM Start services
:start_services
call :log "Starting services..."

cd /d "%PROJECT_ROOT%"

if exist "%DOCKER_COMPOSE_FILE%" (
    call docker-compose up -d
    
    REM Wait for services to be ready
    call :log "Waiting for services to be ready..."
    timeout /t 10 /nobreak >nul
    
    REM Check if services are running
    docker-compose ps | findstr "Up" >nul
    if %errorlevel% equ 0 (
        call :success "Services started successfully"
    ) else (
        call :error "Failed to start services"
        exit /b 1
    )
) else (
    call :warning "Docker Compose file not found, starting services manually..."
    
    REM Start backend
    cd /d "%BACKEND_DIR%"
    start "Backend" cmd /c "npm run dev"
    
    REM Start AI services
    cd /d "%AI_SERVICES_DIR%"
    start "AI Services" cmd /c "python -m uvicorn main:app --reload --port 8001"
    
    REM Start frontend
    cd /d "%FRONTEND_DIR%"
    start "Frontend" cmd /c "npm start"
    
    call :success "Services started manually"
)
goto :eof

REM Stop services
:stop_services
call :log "Stopping services..."

cd /d "%PROJECT_ROOT%"

if exist "%DOCKER_COMPOSE_FILE%" (
    call docker-compose down
    call :success "Services stopped successfully"
) else (
    REM Kill manually started processes
    taskkill /f /im node.exe >nul 2>&1
    taskkill /f /im python.exe >nul 2>&1
    call :success "Services stopped successfully"
)
goto :eof

REM Run security scan
:run_security_scan
call :log "Running security scan..."

REM NPM audit
cd /d "%PROJECT_ROOT%"
call npm audit
if %errorlevel% equ 0 (
    call :success "NPM security audit passed"
) else (
    call :warning "NPM security audit found vulnerabilities"
)

REM Snyk scan (if available)
call :command_exists snyk
if %errorlevel% equ 0 (
    call snyk test
    if %errorlevel% equ 0 (
        call :success "Snyk security scan passed"
    ) else (
        call :warning "Snyk security scan found vulnerabilities"
    )
) else (
    call :warning "Snyk not installed, skipping Snyk scan"
)
goto :eof

REM Run performance tests
:run_performance_tests
call :log "Running performance tests..."

REM Start services for performance testing
call :start_services

REM Wait for services to be ready
timeout /t 30 /nobreak >nul

REM Run Artillery load tests
cd /d "%PROJECT_ROOT%"
call npm run performance:test
if %errorlevel% neq 0 (
    call :error "Performance tests failed"
    call :stop_services
    exit /b 1
)

call :success "Performance tests passed"
call :stop_services
goto :eof

REM Deploy to staging
:deploy_staging
call :log "Deploying to staging..."

REM Build application
call :build_application

REM Run tests
call :run_tests

REM Deploy using Terraform
cd /d "%PROJECT_ROOT%\infrastructure"

call :command_exists terraform
if %errorlevel% equ 0 (
    call terraform init
    call terraform workspace select staging
    call terraform apply -auto-approve -var="image_tag=%GIT_COMMIT%"
    call :success "Deployed to staging successfully"
) else (
    call :error "Terraform not installed"
    exit /b 1
)
goto :eof

REM Deploy to production
:deploy_production
call :log "Deploying to production..."

REM Confirm deployment
set /p confirm="Are you sure you want to deploy to production? (y/N): "
if /i not "%confirm%"=="y" (
    call :warning "Production deployment cancelled"
    exit /b 1
)

REM Build application
call :build_application

REM Run all tests
call :run_tests
call :run_e2e_tests

REM Deploy using Terraform
cd /d "%PROJECT_ROOT%\infrastructure"

call :command_exists terraform
if %errorlevel% equ 0 (
    call terraform init
    call terraform workspace select production
    call terraform apply -auto-approve -var="image_tag=%GIT_COMMIT%"
    call :success "Deployed to production successfully"
) else (
    call :error "Terraform not installed"
    exit /b 1
)
goto :eof

REM Clean up
:cleanup
call :log "Cleaning up..."

REM Stop services
call :stop_services

REM Clean build artifacts
cd /d "%FRONTEND_DIR%"
if exist "build" rmdir /s /q build
if exist "coverage" rmdir /s /q coverage

cd /d "%BACKEND_DIR%"
if exist "dist" rmdir /s /q dist
if exist "coverage" rmdir /s /q coverage

cd /d "%AI_SERVICES_DIR%"
if exist "__pycache__" rmdir /s /q __pycache__
if exist ".pytest_cache" rmdir /s /q .pytest_cache
if exist "htmlcov" rmdir /s /q htmlcov

REM Clean Docker
call docker system prune -f
call docker image prune -f

call :success "Cleanup completed"
goto :eof

REM Show help
:show_help
echo Graphics Design Management System - Automation Script
echo.
echo Usage: %~nx0 [COMMAND]
echo.
echo Commands:
echo   install     Install all dependencies
echo   lint        Run linting checks
echo   test        Run all tests
echo   test:e2e    Run end-to-end tests
echo   build       Build the application
echo   start       Start all services
echo   stop        Stop all services
echo   security    Run security scans
echo   performance Run performance tests
echo   deploy:staging   Deploy to staging
echo   deploy:prod      Deploy to production
echo   cleanup     Clean up build artifacts
echo   full        Run full CI pipeline (install, lint, test, build)
echo   help        Show this help message
echo.
echo Examples:
echo   %~nx0 install
echo   %~nx0 test
echo   %~nx0 deploy:staging
goto :eof

REM Main function
:main
if "%1"=="" goto :show_help

if "%1"=="install" (
    call :check_prerequisites
    call :install_dependencies
    goto :eof
)

if "%1"=="lint" (
    call :run_lint
    goto :eof
)

if "%1"=="test" (
    call :run_tests
    goto :eof
)

if "%1"=="test:e2e" (
    call :run_e2e_tests
    goto :eof
)

if "%1"=="build" (
    call :build_application
    goto :eof
)

if "%1"=="start" (
    call :start_services
    goto :eof
)

if "%1"=="stop" (
    call :stop_services
    goto :eof
)

if "%1"=="security" (
    call :run_security_scan
    goto :eof
)

if "%1"=="performance" (
    call :run_performance_tests
    goto :eof
)

if "%1"=="deploy:staging" (
    call :deploy_staging
    goto :eof
)

if "%1"=="deploy:prod" (
    call :deploy_production
    goto :eof
)

if "%1"=="cleanup" (
    call :cleanup
    goto :eof
)

if "%1"=="full" (
    call :check_prerequisites
    call :install_dependencies
    call :run_lint
    call :run_tests
    call :build_application
    call :run_security_scan
    goto :eof
)

if "%1"=="help" goto :show_help

call :show_help
exit /b 1

REM Call main function with arguments
call :main %* 