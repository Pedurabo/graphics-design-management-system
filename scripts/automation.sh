#!/bin/bash

# Graphics Design Management System - Automation Script
# This script automates the development, testing, and deployment workflow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
AI_SERVICES_DIR="$PROJECT_ROOT/ai-services"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists python3; then
        missing_deps+=("Python 3")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    success "All prerequisites are installed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Install root dependencies
    cd "$PROJECT_ROOT"
    npm install
    
    # Install frontend dependencies
    cd "$FRONTEND_DIR"
    npm install
    
    # Install backend dependencies
    cd "$BACKEND_DIR"
    npm install
    
    # Install AI services dependencies
    cd "$AI_SERVICES_DIR"
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
    fi
    
    success "Dependencies installed successfully"
}

# Run linting
run_lint() {
    log "Running linting..."
    
    local lint_errors=0
    
    # Frontend linting
    cd "$FRONTEND_DIR"
    if npm run lint; then
        success "Frontend linting passed"
    else
        error "Frontend linting failed"
        lint_errors=$((lint_errors + 1))
    fi
    
    # Backend linting
    cd "$BACKEND_DIR"
    if npm run lint; then
        success "Backend linting passed"
    else
        error "Backend linting failed"
        lint_errors=$((lint_errors + 1))
    fi
    
    if [ $lint_errors -eq 0 ]; then
        success "All linting checks passed"
    else
        error "$lint_errors linting check(s) failed"
        return 1
    fi
}

# Run tests
run_tests() {
    log "Running tests..."
    
    local test_errors=0
    
    # Frontend tests
    cd "$FRONTEND_DIR"
    if npm test -- --watchAll=false --coverage; then
        success "Frontend tests passed"
    else
        error "Frontend tests failed"
        test_errors=$((test_errors + 1))
    fi
    
    # Backend tests
    cd "$BACKEND_DIR"
    if npm test; then
        success "Backend tests passed"
    else
        error "Backend tests failed"
        test_errors=$((test_errors + 1))
    fi
    
    # AI services tests
    cd "$AI_SERVICES_DIR"
    if python3 -m pytest tests/ -v --cov=services --cov-report=html; then
        success "AI services tests passed"
    else
        error "AI services tests failed"
        test_errors=$((test_errors + 1))
    fi
    
    if [ $test_errors -eq 0 ]; then
        success "All tests passed"
    else
        error "$test_errors test suite(s) failed"
        return 1
    fi
}

# Run E2E tests
run_e2e_tests() {
    log "Running E2E tests..."
    
    # Start the application for E2E testing
    start_services
    
    # Wait for services to be ready
    sleep 30
    
    # Run Cypress tests
    cd "$FRONTEND_DIR"
    if npm run test:e2e; then
        success "E2E tests passed"
    else
        error "E2E tests failed"
        stop_services
        return 1
    fi
    
    stop_services
}

# Build application
build_application() {
    log "Building application..."
    
    # Build frontend
    cd "$FRONTEND_DIR"
    if npm run build; then
        success "Frontend built successfully"
    else
        error "Frontend build failed"
        return 1
    fi
    
    # Build backend
    cd "$BACKEND_DIR"
    if npm run build; then
        success "Backend built successfully"
    else
        error "Backend build failed"
        return 1
    fi
    
    success "Application built successfully"
}

# Start services
start_services() {
    log "Starting services..."
    
    cd "$PROJECT_ROOT"
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker-compose up -d
        
        # Wait for services to be ready
        log "Waiting for services to be ready..."
        sleep 10
        
        # Check if services are running
        if docker-compose ps | grep -q "Up"; then
            success "Services started successfully"
        else
            error "Failed to start services"
            return 1
        fi
    else
        warning "Docker Compose file not found, starting services manually..."
        
        # Start backend
        cd "$BACKEND_DIR"
        npm run dev &
        BACKEND_PID=$!
        
        # Start AI services
        cd "$AI_SERVICES_DIR"
        python3 -m uvicorn main:app --reload --port 8001 &
        AI_PID=$!
        
        # Start frontend
        cd "$FRONTEND_DIR"
        npm start &
        FRONTEND_PID=$!
        
        success "Services started manually (PIDs: $BACKEND_PID, $AI_PID, $FRONTEND_PID)"
    fi
}

# Stop services
stop_services() {
    log "Stopping services..."
    
    cd "$PROJECT_ROOT"
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker-compose down
        success "Services stopped successfully"
    else
        # Kill manually started processes
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        if [ ! -z "$AI_PID" ]; then
            kill $AI_PID 2>/dev/null || true
        fi
        if [ ! -z "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID 2>/dev/null || true
        fi
        success "Services stopped successfully"
    fi
}

# Run security scan
run_security_scan() {
    log "Running security scan..."
    
    # NPM audit
    cd "$PROJECT_ROOT"
    if npm audit; then
        success "NPM security audit passed"
    else
        warning "NPM security audit found vulnerabilities"
    fi
    
    # Snyk scan (if available)
    if command_exists snyk; then
        if snyk test; then
            success "Snyk security scan passed"
        else
            warning "Snyk security scan found vulnerabilities"
        fi
    else
        warning "Snyk not installed, skipping Snyk scan"
    fi
}

# Run performance tests
run_performance_tests() {
    log "Running performance tests..."
    
    # Start services for performance testing
    start_services
    
    # Wait for services to be ready
    sleep 30
    
    # Run Artillery load tests
    cd "$PROJECT_ROOT"
    if npm run performance:test; then
        success "Performance tests passed"
    else
        error "Performance tests failed"
        stop_services
        return 1
    fi
    
    stop_services
}

# Deploy to staging
deploy_staging() {
    log "Deploying to staging..."
    
    # Build application
    build_application
    
    # Run tests
    run_tests
    
    # Deploy using Terraform
    cd "$PROJECT_ROOT/infrastructure"
    
    if command_exists terraform; then
        terraform init
        terraform workspace select staging
        terraform apply -auto-approve -var="image_tag=$(git rev-parse HEAD)"
        success "Deployed to staging successfully"
    else
        error "Terraform not installed"
        return 1
    fi
}

# Deploy to production
deploy_production() {
    log "Deploying to production..."
    
    # Confirm deployment
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Production deployment cancelled"
        return 1
    fi
    
    # Build application
    build_application
    
    # Run all tests
    run_tests
    run_e2e_tests
    
    # Deploy using Terraform
    cd "$PROJECT_ROOT/infrastructure"
    
    if command_exists terraform; then
        terraform init
        terraform workspace select production
        terraform apply -auto-approve -var="image_tag=$(git rev-parse HEAD)"
        success "Deployed to production successfully"
    else
        error "Terraform not installed"
        return 1
    fi
}

# Clean up
cleanup() {
    log "Cleaning up..."
    
    # Stop services
    stop_services
    
    # Clean build artifacts
    cd "$FRONTEND_DIR"
    rm -rf build coverage
    
    cd "$BACKEND_DIR"
    rm -rf dist coverage
    
    cd "$AI_SERVICES_DIR"
    rm -rf __pycache__ .pytest_cache htmlcov
    
    # Clean Docker
    docker system prune -f
    docker image prune -f
    
    success "Cleanup completed"
}

# Show help
show_help() {
    echo "Graphics Design Management System - Automation Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install     Install all dependencies"
    echo "  lint        Run linting checks"
    echo "  test        Run all tests"
    echo "  test:e2e    Run end-to-end tests"
    echo "  build       Build the application"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  security    Run security scans"
    echo "  performance Run performance tests"
    echo "  deploy:staging   Deploy to staging"
    echo "  deploy:prod      Deploy to production"
    echo "  cleanup     Clean up build artifacts"
    echo "  full        Run full CI pipeline (install, lint, test, build)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install"
    echo "  $0 test"
    echo "  $0 deploy:staging"
}

# Main function
main() {
    case "${1:-help}" in
        install)
            check_prerequisites
            install_dependencies
            ;;
        lint)
            run_lint
            ;;
        test)
            run_tests
            ;;
        test:e2e)
            run_e2e_tests
            ;;
        build)
            build_application
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        security)
            run_security_scan
            ;;
        performance)
            run_performance_tests
            ;;
        deploy:staging)
            deploy_staging
            ;;
        deploy:prod)
            deploy_production
            ;;
        cleanup)
            cleanup
            ;;
        full)
            check_prerequisites
            install_dependencies
            run_lint
            run_tests
            build_application
            run_security_scan
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@" 