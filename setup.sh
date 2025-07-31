#!/bin/bash

# Graphics Design Management System Setup Script
# This script sets up the entire application with all components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    # Check Python
    if ! command_exists python3; then
        missing_deps+=("python3")
    fi
    
    # Check Git
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Frontend environment
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_AI_SERVICE_URL=http://localhost:8001
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_ENVIRONMENT=development
EOF
    
    # Backend environment
    cat > backend/.env << EOF
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/graphics_design_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
AI_SERVICE_URL=http://localhost:8001
ELASTICSEARCH_URL=http://localhost:9200
MONGODB_URL=mongodb://localhost:27017/graphics_design
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
EOF
    
    # AI Services environment
    cat > ai-services/.env << EOF
ENVIRONMENT=development
MODEL_PATH=/app/models
GPU_ENABLED=false
DATABASE_URL=postgresql://postgres:password@localhost:5432/graphics_design_db
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
BACKEND_URL=http://localhost:8000
ALLOWED_ORIGINS=["http://localhost:3000"]
ALLOWED_HOSTS=["localhost", "127.0.0.1"]
EOF
    
    print_success "Environment files created"
}

# Function to install frontend dependencies
install_frontend() {
    print_status "Installing frontend dependencies..."
    
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        npm install --silent
    fi
    
    cd ..
    print_success "Frontend dependencies installed"
}

# Function to install backend dependencies
install_backend() {
    print_status "Installing backend dependencies..."
    
    cd backend
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        npm install --silent
    fi
    
    cd ..
    print_success "Backend dependencies installed"
}

# Function to install AI services dependencies
install_ai_services() {
    print_status "Installing AI services dependencies..."
    
    cd ai-services
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Deactivate virtual environment
    deactivate
    
    cd ..
    print_success "AI services dependencies installed"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Create database initialization script
    cat > database/init.sql << EOF
-- Graphics Design Management System Database Initialization

-- Create database if not exists
SELECT 'CREATE DATABASE graphics_design_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'graphics_design_db')\gexec

-- Connect to the database
\c graphics_design_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id),
    canvas_data JSONB,
    settings JSONB,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    user_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create collaborations table
CREATE TABLE IF NOT EXISTS collaborations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'viewer',
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id),
    suggestion_type VARCHAR(100) NOT NULL,
    suggestion_data JSONB NOT NULL,
    confidence FLOAT,
    applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_project_id ON collaborations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_project_id ON ai_suggestions(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES ('admin@graphicsdesign.com', '\$2b\$10\$rQZ8N3YqX2vB1cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
\$\$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF
    
    print_success "Database initialization script created"
}

# Function to start services
start_services() {
    print_status "Starting services with Docker Compose..."
    
    # Start all services
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "All services are running"
    else
        print_error "Some services failed to start"
        docker-compose logs
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run backend migrations
    cd backend
    npm run migrate
    cd ..
    
    print_success "Database migrations completed"
}

# Function to seed database
seed_database() {
    print_status "Seeding database with initial data..."
    
    cd backend
    npm run seed
    cd ..
    
    print_success "Database seeded with initial data"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend application..."
    
    cd frontend
    npm run build
    cd ..
    
    print_success "Frontend application built"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    print_status "Running frontend tests..."
    cd frontend
    npm test -- --watchAll=false --coverage
    cd ..
    
    # Backend tests
    print_status "Running backend tests..."
    cd backend
    npm test
    cd ..
    
    # AI services tests
    print_status "Running AI services tests..."
    cd ai-services
    source venv/bin/activate
    pytest tests/ -v
    deactivate
    cd ..
    
    print_success "All tests completed"
}

# Function to show service URLs
show_service_urls() {
    print_success "Setup completed successfully!"
    echo ""
    echo "Service URLs:"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "AI Services: http://localhost:8001"
    echo "Grafana: http://localhost:3001 (admin/admin)"
    echo "Prometheus: http://localhost:9090"
    echo "Kibana: http://localhost:5601"
    echo "SonarQube: http://localhost:9000"
    echo "Vault: http://localhost:8200"
    echo ""
    echo "Default admin credentials:"
    echo "Email: admin@graphicsdesign.com"
    echo "Password: admin123"
    echo ""
    echo "To stop all services: docker-compose down"
    echo "To view logs: docker-compose logs -f"
}

# Main setup function
main() {
    echo "=========================================="
    echo "Graphics Design Management System Setup"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Create environment files
    create_env_files
    
    # Install dependencies
    install_frontend
    install_backend
    install_ai_services
    
    # Setup database
    setup_database
    
    # Start services
    start_services
    
    # Run migrations and seed data
    run_migrations
    seed_database
    
    # Build frontend
    build_frontend
    
    # Run tests (optional - can be skipped for faster setup)
    if [ "$1" != "--skip-tests" ]; then
        run_tests
    else
        print_warning "Skipping tests (use --skip-tests flag)"
    fi
    
    # Show service URLs
    show_service_urls
}

# Run main function with all arguments
main "$@" 