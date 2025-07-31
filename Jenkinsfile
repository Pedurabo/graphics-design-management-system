pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'ghcr.io'
        IMAGE_NAME = 'graphics-design-system'
        NODE_VERSION = '18'
        PYTHON_VERSION = '3.11'
    }
    
    stages {
        stage('Checkout & Setup') {
            steps {
                checkout scm
                
                // Setup tools
                sh '''
                    echo "Setting up Jenkins environment..."
                    node --version
                    npm --version
                    python --version
                    docker --version
                '''
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('AI Services Dependencies') {
                    steps {
                        dir('ai-services') {
                            sh 'pip install -r requirements.txt'
                        }
                    }
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Lint Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Lint Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Lint Python') {
                    steps {
                        dir('ai-services') {
                            sh '''
                                pip install flake8 black isort
                                flake8 . --max-line-length=100
                                black --check .
                                isort --check-only .
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh '''
                    echo "Running security scans..."
                    npm audit --audit-level=high || true
                    cd ai-services && bandit -r . -f json -o bandit-report.json || true
                '''
            }
        }
        
        stage('Test') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm run test:ci'
                        }
                    }
                }
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm run test:ci'
                        }
                    }
                }
                stage('AI Services Tests') {
                    steps {
                        dir('ai-services') {
                            sh 'python -m pytest tests/ -v'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // Build frontend
                    docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}/frontend:${BUILD_NUMBER}", "./frontend")
                    
                    // Build backend
                    docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}/backend:${BUILD_NUMBER}", "./backend")
                    
                    // Build AI services
                    docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}/ai-services:${BUILD_NUMBER}", "./ai-services")
                }
            }
        }
        
        stage('Push Docker Images') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-credentials') {
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}/frontend:${BUILD_NUMBER}").push()
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}/backend:${BUILD_NUMBER}").push()
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}/ai-services:${BUILD_NUMBER}").push()
                        
                        // Tag as latest
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}/frontend:${BUILD_NUMBER}").push('latest')
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}/backend:${BUILD_NUMBER}").push('latest')
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}/ai-services:${BUILD_NUMBER}").push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    echo "Deploying to staging environment..."
                    docker-compose -f docker-compose.yml up -d
                    
                    # Wait for services to be ready
                    sleep 30
                    
                    # Health check
                    curl -f http://localhost:3000/health || exit 1
                    curl -f http://localhost:8000/health || exit 1
                    curl -f http://localhost:5000/health || exit 1
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    echo "Deploying to production environment..."
                    
                    # Stop existing containers
                    docker-compose down || true
                    
                    # Pull latest images
                    docker-compose pull
                    
                    # Start with new images
                    docker-compose -f docker-compose.yml up -d
                    
                    # Wait for services to be ready
                    sleep 60
                    
                    # Health check
                    curl -f http://localhost:3000/health || exit 1
                    curl -f http://localhost:8000/health || exit 1
                    curl -f http://localhost:5000/health || exit 1
                    
                    echo "Production deployment successful!"
                '''
            }
        }
        
        stage('Performance Test') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    echo "Running performance tests..."
                    npm install -g artillery
                    artillery run tests/performance/load-test.yml
                '''
            }
        }
        
        stage('Cleanup') {
            always {
                sh '''
                    echo "Cleaning up..."
                    docker system prune -f
                    docker image prune -f
                '''
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            // Send success notification
            emailext (
                subject: "Pipeline SUCCESS: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Pipeline completed successfully. Build: ${env.BUILD_URL}",
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
            )
        }
        failure {
            echo 'Pipeline failed!'
            // Send failure notification
            emailext (
                subject: "Pipeline FAILED: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Pipeline failed. Build: ${env.BUILD_URL}",
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
            )
        }
        always {
            // Archive test results
            archiveArtifacts artifacts: '**/coverage/**/*, **/test-results/**/*', allowEmptyArchive: true
            
            // Clean workspace
            cleanWs()
        }
    }
} 