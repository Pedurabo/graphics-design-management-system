#!/bin/bash

# Enhanced Graphics Application - Quick Deployment Script
# Uses Jenkins-style CI/CD techniques for rapid deployment

set -e  # Exit on any error

echo "🚀 Starting Enhanced Graphics Application Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="enhanced-graphics-app"
DOCKER_COMPOSE_FILE="docker-compose.yml"
FRONTEND_PORT=3000
BACKEND_PORT=8000
AI_SERVICE_PORT=5000

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command_exists node; then
        print_warning "Node.js is not installed. Some features may not work."
    fi
    
    if ! command_exists python3; then
        print_warning "Python 3 is not installed. AI services may not work."
    fi
    
    print_success "Prerequisites check completed"
}

# Stop existing containers
stop_containers() {
    print_status "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans || true
    print_success "Existing containers stopped"
}

# Build and start services
build_and_start() {
    print_status "Building and starting services..."
    
    # Build images
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    # Start services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    print_success "Services built and started"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Attempt $attempt/$max_attempts - Checking services..."
        
        # Check frontend
        if curl -f http://localhost:$FRONTEND_PORT/health >/dev/null 2>&1; then
            print_success "Frontend is ready"
        else
            print_warning "Frontend not ready yet"
        fi
        
        # Check backend
        if curl -f http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            print_success "Backend is ready"
        else
            print_warning "Backend not ready yet"
        fi
        
        # Check AI service
        if curl -f http://localhost:$AI_SERVICE_PORT/health >/dev/null 2>&1; then
            print_success "AI Service is ready"
        else
            print_warning "AI Service not ready yet"
        fi
        
        # If all services are ready, break
        if curl -f http://localhost:$FRONTEND_PORT/health >/dev/null 2>&1 && \
           curl -f http://localhost:$BACKEND_PORT/health >/dev/null 2>&1 && \
           curl -f http://localhost:$AI_SERVICE_PORT/health >/dev/null 2>&1; then
            print_success "All services are ready!"
            break
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Services failed to start within expected time"
        exit 1
    fi
}

# Run health checks
health_check() {
    print_status "Running health checks..."
    
    # Check frontend
    if curl -f http://localhost:$FRONTEND_PORT/health >/dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    # Check backend
    if curl -f http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check AI service
    if curl -f http://localhost:$AI_SERVICE_PORT/health >/dev/null 2>&1; then
        print_success "AI Service health check passed"
    else
        print_error "AI Service health check failed"
        return 1
    fi
    
    print_success "All health checks passed"
}

# Open application in browser
open_application() {
    print_status "Opening application in browser..."
    
    # Detect OS and open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open http://localhost:$FRONTEND_PORT
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists xdg-open; then
            xdg-open http://localhost:$FRONTEND_PORT
        elif command_exists gnome-open; then
            gnome-open http://localhost:$FRONTEND_PORT
        else
            print_warning "Could not automatically open browser. Please visit: http://localhost:$FRONTEND_PORT"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows
        start http://localhost:$FRONTEND_PORT
    else
        print_warning "Could not automatically open browser. Please visit: http://localhost:$FRONTEND_PORT"
    fi
    
    print_success "Application opened in browser"
}

# Show service status
show_status() {
    print_status "Service Status:"
    echo "=================="
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    echo ""
    print_status "Service URLs:"
    echo "==============="
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Backend API: http://localhost:$BACKEND_PORT"
    echo "AI Service: http://localhost:$AI_SERVICE_PORT"
    echo "Grafana Dashboard: http://localhost:3001"
    echo "Prometheus: http://localhost:9090"
    echo ""
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    check_prerequisites
    stop_containers
    build_and_start
    wait_for_services
    health_check
    show_status
    open_application
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Your enhanced graphics application with medical features is now running!"
}

# Quick start function (for development)
quick_start() {
    print_status "Starting quick development mode..."
    
    # Start only essential services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d frontend backend ai-services
    
    wait_for_services
    show_status
    open_application
    
    print_success "🚀 Quick start completed!"
}

# Stop function
stop() {
    print_status "Stopping all services..."
    docker-compose -f $DOCKER_COMPOSE_FILE down
    print_success "All services stopped"
}

# Logs function
logs() {
    print_status "Showing service logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs -f
}

# Cleanup function
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose -f $DOCKER_COMPOSE_FILE down --volumes --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Show help
show_help() {
    echo "Enhanced Graphics Application Deployment Script"
    echo "=============================================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Full deployment with all services"
    echo "  quick      - Quick start for development"
    echo "  stop       - Stop all services"
    echo "  logs       - Show service logs"
    echo "  cleanup    - Clean up Docker resources"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Full deployment"
    echo "  $0 quick     # Quick development start"
    echo "  $0 stop      # Stop services"
    echo ""
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "quick")
        quick_start
        ;;
    "stop")
        stop
        ;;
    "logs")
        logs
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 