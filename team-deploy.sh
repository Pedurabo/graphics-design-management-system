#!/bin/bash

# Team Deployment Script - DevOps Continuous Development
# Allows each team to work independently and deploy their components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Team configurations
TEAMS=(
    "frontend:React,TypeScript,Canvas API,WebGL:3000"
    "backend:Node.js,Express,Database,Authentication:8000"
    "ai:Python,TensorFlow,Medical AI,Computer Vision:5000"
    "devops:Docker,Kubernetes,CI/CD,Monitoring:9090"
    "qa:Testing,Automation,Performance,Security:3001"
)

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  Team Deployment Script${NC}"
    echo -e "${PURPLE}  DevOps Continuous Development${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_team_info() {
    local team_name=$1
    local focus=$2
    local port=$3
    
    echo -e "${CYAN}Team: ${team_name}${NC}"
    echo -e "${CYAN}Focus: ${focus}${NC}"
    echo -e "${CYAN}Port: ${port}${NC}"
    echo ""
}

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

# Check prerequisites for all teams
check_prerequisites() {
    print_status "Checking prerequisites for all teams..."
    
    # Common prerequisites
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Team-specific prerequisites
    if ! command_exists node; then
        print_warning "Node.js is not installed. Frontend and Backend teams may have issues."
    fi
    
    if ! command_exists python3; then
        print_warning "Python 3 is not installed. AI team may have issues."
    fi
    
    if ! command_exists git; then
        print_warning "Git is not installed. Version control may be affected."
    fi
    
    print_success "Prerequisites check completed"
}

# Deploy specific team
deploy_team() {
    local team_name=$1
    local focus=$2
    local port=$3
    
    print_header
    print_team_info "$team_name" "$focus" "$port"
    
    case $team_name in
        "frontend")
            deploy_frontend_team
            ;;
        "backend")
            deploy_backend_team
            ;;
        "ai")
            deploy_ai_team
            ;;
        "devops")
            deploy_devops_team
            ;;
        "qa")
            deploy_qa_team
            ;;
        *)
            print_error "Unknown team: $team_name"
            exit 1
            ;;
    esac
}

# Frontend Team Deployment
deploy_frontend_team() {
    print_status "Deploying Frontend Team..."
    
    # Check if frontend directory exists
    if [ ! -d "teams/frontend-team" ]; then
        print_error "Frontend team directory not found. Creating structure..."
        mkdir -p teams/frontend-team
        cd teams/frontend-team
        
        # Initialize React project
        npx create-react-app . --template typescript --yes
        npm install
    else
        cd teams/frontend-team
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Run tests
    print_status "Running frontend tests..."
    npm test -- --watchAll=false --coverage
    
    # Build project
    print_status "Building frontend project..."
    npm run build
    
    # Start development server
    print_status "Starting frontend development server..."
    npm start &
    
    print_success "Frontend team deployed successfully!"
    print_status "Frontend available at: http://localhost:3000"
}

# Backend Team Deployment
deploy_backend_team() {
    print_status "Deploying Backend Team..."
    
    # Check if backend directory exists
    if [ ! -d "teams/backend-team" ]; then
        print_error "Backend team directory not found. Creating structure..."
        mkdir -p teams/backend-team
        cd teams/backend-team
        
        # Initialize Node.js project
        npm init -y
        npm install express cors helmet dotenv
    else
        cd teams/backend-team
    fi
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Run tests
    print_status "Running backend tests..."
    npm test
    
    # Start development server
    print_status "Starting backend development server..."
    npm run dev &
    
    print_success "Backend team deployed successfully!"
    print_status "Backend API available at: http://localhost:8000"
}

# AI Team Deployment
deploy_ai_team() {
    print_status "Deploying AI/ML Team..."
    
    # Check if AI directory exists
    if [ ! -d "teams/ai-team" ]; then
        print_error "AI team directory not found. Creating structure..."
        mkdir -p teams/ai-team
        cd teams/ai-team
        
        # Create virtual environment
        python3 -m venv venv
        source venv/bin/activate
        
        # Install basic dependencies
        pip install fastapi uvicorn numpy pandas
    else
        cd teams/ai-team
        source venv/bin/activate
    fi
    
    # Install dependencies
    print_status "Installing AI dependencies..."
    pip install -r requirements.txt
    
    # Run tests
    print_status "Running AI tests..."
    pytest tests/ -v
    
    # Start AI service
    print_status "Starting AI service..."
    uvicorn main:app --host 0.0.0.0 --port 5000 --reload &
    
    print_success "AI team deployed successfully!"
    print_status "AI service available at: http://localhost:5000"
}

# DevOps Team Deployment
deploy_devops_team() {
    print_status "Deploying DevOps Team..."
    
    # Check if DevOps directory exists
    if [ ! -d "teams/devops-team" ]; then
        print_error "DevOps team directory not found. Creating structure..."
        mkdir -p teams/devops-team
        cd teams/devops-team
    else
        cd teams/devops-team
    fi
    
    # Start monitoring services
    print_status "Starting monitoring services..."
    docker-compose -f ../../docker-compose.yml up -d prometheus grafana alertmanager
    
    # Start Jenkins (if available)
    if command_exists java; then
        print_status "Starting Jenkins..."
        docker run -d -p 8080:8080 -p 50000:50000 jenkins/jenkins:lts
        print_status "Jenkins available at: http://localhost:8080"
    fi
    
    print_success "DevOps team deployed successfully!"
    print_status "Monitoring available at: http://localhost:9090"
}

# QA Team Deployment
deploy_qa_team() {
    print_status "Deploying QA Team..."
    
    # Check if QA directory exists
    if [ ! -d "teams/qa-team" ]; then
        print_error "QA team directory not found. Creating structure..."
        mkdir -p teams/qa-team
        cd teams/qa-team
        
        # Initialize QA project
        npm init -y
        npm install jest cypress playwright
    else
        cd teams/qa-team
    fi
    
    # Install dependencies
    print_status "Installing QA dependencies..."
    npm install
    
    # Run security scan
    print_status "Running security scan..."
    npm audit --audit-level=high || true
    
    # Run performance tests
    print_status "Running performance tests..."
    npm run performance || true
    
    print_success "QA team deployed successfully!"
    print_status "QA dashboard available at: http://localhost:3001"
}

# Deploy all teams
deploy_all_teams() {
    print_header
    print_status "Deploying all teams using DevOps continuous development..."
    
    check_prerequisites
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans || true
    
    # Deploy each team
    for team_info in "${TEAMS[@]}"; do
        IFS=':' read -r team_name focus port <<< "$team_info"
        print_status "Deploying $team_name team..."
        deploy_team "$team_name" "$focus" "$port"
        sleep 2
    done
    
    # Start main application
    print_status "Starting main application..."
    docker-compose up -d
    
    print_success "All teams deployed successfully!"
    show_team_status
}

# Show team status
show_team_status() {
    print_header
    print_status "Team Status:"
    echo "============="
    
    for team_info in "${TEAMS[@]}"; do
        IFS=':' read -r team_name focus port <<< "$team_info"
        if curl -f "http://localhost:$port/health" >/dev/null 2>&1; then
            print_success "$team_name: Running (Port: $port)"
        else
            print_warning "$team_name: Starting (Port: $port)"
        fi
    done
    
    echo ""
    print_status "Service URLs:"
    echo "=============="
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "AI Service: http://localhost:5000"
    echo "Jenkins: http://localhost:8080"
    echo "Prometheus: http://localhost:9090"
    echo "Grafana: http://localhost:3001"
    echo ""
}

# Stop all teams
stop_all_teams() {
    print_status "Stopping all teams..."
    
    # Stop Docker containers
    docker-compose down
    
    # Stop development servers
    pkill -f "npm start" || true
    pkill -f "npm run dev" || true
    pkill -f "uvicorn" || true
    
    print_success "All teams stopped"
}

# Show help
show_help() {
    print_header
    echo "Usage: $0 [COMMAND] [TEAM]"
    echo ""
    echo "Commands:"
    echo "  deploy [team]  - Deploy specific team or all teams"
    echo "  stop           - Stop all teams"
    echo "  status         - Show team status"
    echo "  help           - Show this help message"
    echo ""
    echo "Teams:"
    for team_info in "${TEAMS[@]}"; do
        IFS=':' read -r team_name focus port <<< "$team_info"
        echo "  $team_name - $focus (Port: $port)"
    done
    echo ""
    echo "Examples:"
    echo "  $0 deploy              # Deploy all teams"
    echo "  $0 deploy frontend     # Deploy frontend team only"
    echo "  $0 deploy ai           # Deploy AI team only"
    echo "  $0 stop                # Stop all teams"
    echo "  $0 status              # Show status"
    echo ""
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        if [ -n "$2" ]; then
            # Deploy specific team
            for team_info in "${TEAMS[@]}"; do
                IFS=':' read -r team_name focus port <<< "$team_info"
                if [ "$team_name" = "$2" ]; then
                    deploy_team "$team_name" "$focus" "$port"
                    exit 0
                fi
            done
            print_error "Unknown team: $2"
            show_help
            exit 1
        else
            # Deploy all teams
            deploy_all_teams
        fi
        ;;
    "stop")
        stop_all_teams
        ;;
    "status")
        show_team_status
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