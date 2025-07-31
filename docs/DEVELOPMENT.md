# Development Guide

## Overview

This document provides comprehensive guidance for developing the Graphics Design Management System. It covers setup, testing, development workflows, and best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Code Quality](#code-quality)
6. [Performance](#performance)
7. [Security](#security)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Python** (v3.9 or higher)
- **Docker** (v20.0.0 or higher)
- **Docker Compose** (v2.0.0 or higher)
- **Git** (v2.30.0 or higher)

### Optional Software

- **Terraform** (v1.5.0 or higher) - for infrastructure deployment
- **kubectl** (v1.25.0 or higher) - for Kubernetes management
- **Snyk** - for security scanning

### System Requirements

- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **CPU**: Multi-core processor recommended
- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd graphics-design-management-system
```

### 2. Install Dependencies

#### Using Automation Script (Recommended)

```bash
# Windows
scripts\automation.bat install

# Linux/macOS
./scripts/automation.sh install
```

#### Manual Installation

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install

# AI services dependencies
cd ../ai-services
pip install -r requirements.txt
```

### 3. Environment Configuration

Create environment files for each service:

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_AI_SERVICE_URL=http://localhost:8001
REACT_APP_WEBSOCKET_URL=ws://localhost:8000
```

#### Backend (.env)
```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/graphics_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

#### AI Services (.env)
```env
ENVIRONMENT=development
MODEL_PATH=./models
GPU_ENABLED=false
```

### 4. Database Setup

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
cd backend
npm run migrate

# Seed database
npm run seed
```

## Development Workflow

### Starting Development Environment

```bash
# Start all services
npm run dev

# Or use automation script
scripts/automation.bat start  # Windows
./scripts/automation.sh start  # Linux/macOS
```

### Development Commands

```bash
# Install dependencies
npm run install:all

# Run linting
npm run lint

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Build application
npm run build

# Start services
npm run dev

# Stop services
npm run docker:down
```

### Code Organization

```
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── utils/          # Utility functions
│   │   └── tests/          # Test files
│   └── public/             # Static assets
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   └── tests/              # Test files
├── ai-services/            # Python AI services
│   ├── services/           # AI service modules
│   ├── models/             # ML models
│   ├── utils/              # Utility functions
│   └── tests/              # Test files
└── infrastructure/         # Infrastructure as Code
```

## Testing

### Test Types

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test service interactions
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Load and stress testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:frontend
npm run test:backend
npm run test:ai

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run performance:test

# Generate coverage report
npm run coverage:report
```

### Writing Tests

#### Frontend Tests (React)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Editor from '../Editor';

describe('Editor Component', () => {
  test('renders editor interface', () => {
    render(<Editor />);
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
  });

  test('switches tools correctly', async () => {
    const user = userEvent.setup();
    render(<Editor />);
    
    await user.click(screen.getByText('Brush'));
    expect(screen.getByTestId('current-tool')).toHaveTextContent('Brush');
  });
});
```

#### Backend Tests (Node.js)

```typescript
import request from 'supertest';
import { app } from '../src/app';

describe('Project API', () => {
  test('creates new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project',
        description: 'Test description'
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

#### AI Services Tests (Python)

```python
import pytest
from services.image_enhancement import enhance_image

def test_enhance_image():
    # Test image enhancement
    result = enhance_image('test_image.jpg', ['brightness', 'contrast'])
    assert result['enhanced_image'] is not None
    assert result['processing_time'] > 0
```

### Test Coverage

- **Frontend**: Minimum 80% coverage
- **Backend**: Minimum 85% coverage
- **AI Services**: Minimum 75% coverage

## Code Quality

### Linting and Formatting

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Code Standards

#### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Maximum line length: 100 characters
- Use meaningful variable names
- Add JSDoc comments for public APIs

#### Python

- Follow PEP 8 style guide
- Use type hints
- Maximum line length: 88 characters (Black)
- Use meaningful variable names
- Add docstrings for functions and classes

### Git Workflow

1. **Feature Branches**: Create feature branches from `develop`
2. **Commit Messages**: Use conventional commit format
3. **Pull Requests**: Require code review and CI checks
4. **Merge Strategy**: Squash and merge to `develop`

#### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(editor): add brush tool functionality`
- `fix(auth): resolve login validation issue`
- `docs(readme): update installation instructions`

## Performance

### Frontend Performance

- **Bundle Size**: Keep under 2MB gzipped
- **Lighthouse Score**: Minimum 90 for all metrics
- **First Contentful Paint**: Under 1.5 seconds
- **Time to Interactive**: Under 3 seconds

### Backend Performance

- **Response Time**: Under 200ms for API calls
- **Database Queries**: Optimize with proper indexing
- **Memory Usage**: Monitor and optimize
- **CPU Usage**: Efficient algorithms and caching

### Monitoring

```bash
# Run performance tests
npm run performance:test

# Monitor application metrics
npm run monitor

# Generate performance report
npm run performance:report
```

## Security

### Security Practices

1. **Input Validation**: Validate all user inputs
2. **Authentication**: Use JWT with proper expiration
3. **Authorization**: Implement role-based access control
4. **Data Encryption**: Encrypt sensitive data
5. **HTTPS**: Use HTTPS in production
6. **Dependencies**: Regular security updates

### Security Scanning

```bash
# Run security scans
npm run security:scan

# Fix security issues
npm run security:fix

# Audit dependencies
npm audit
```

### Common Vulnerabilities

- **SQL Injection**: Use parameterized queries
- **XSS**: Sanitize user inputs
- **CSRF**: Use CSRF tokens
- **Authentication**: Secure session management

## Deployment

### Environment Setup

1. **Development**: Local development environment
2. **Staging**: Pre-production testing environment
3. **Production**: Live application environment

### Deployment Process

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### Infrastructure

- **Containerization**: Docker for all services
- **Orchestration**: Kubernetes for production
- **CI/CD**: GitHub Actions for automation
- **Monitoring**: Prometheus and Grafana
- **Logging**: ELK stack

## Troubleshooting

### Common Issues

#### Frontend Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset development server
npm run dev:frontend
```

#### Backend Issues

```bash
# Check database connection
npm run db:check

# Reset database
npm run db:reset

# Check logs
npm run logs
```

#### AI Services Issues

```bash
# Check Python environment
python --version
pip list

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Debugging

#### Frontend Debugging

1. Use React Developer Tools
2. Check browser console for errors
3. Use Redux DevTools for state management
4. Monitor network requests

#### Backend Debugging

1. Use Node.js debugger
2. Check application logs
3. Monitor database queries
4. Use Postman for API testing

#### AI Services Debugging

1. Use Python debugger (pdb)
2. Check model loading
3. Monitor GPU usage
4. Validate input data

### Performance Issues

1. **Memory Leaks**: Monitor memory usage
2. **Slow Queries**: Optimize database queries
3. **Large Bundles**: Analyze bundle size
4. **Network Issues**: Check API response times

### Getting Help

1. Check existing documentation
2. Search GitHub issues
3. Create detailed bug reports
4. Contact the development team

## Best Practices

### Development

1. **Write Tests First**: Follow TDD approach
2. **Code Review**: Always review code changes
3. **Documentation**: Keep documentation updated
4. **Version Control**: Use meaningful commit messages
5. **Security**: Follow security best practices

### Performance

1. **Optimize Images**: Use appropriate formats and sizes
2. **Caching**: Implement proper caching strategies
3. **Lazy Loading**: Load resources on demand
4. **Code Splitting**: Split code into smaller chunks

### Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Monitoring**: Monitor application health
3. **Backups**: Regular database backups
4. **Logs**: Maintain comprehensive logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For additional support:

- **Documentation**: Check `/docs` directory
- **Issues**: Create GitHub issues
- **Discussions**: Use GitHub Discussions
- **Email**: support@graphicsdesignsystem.com 