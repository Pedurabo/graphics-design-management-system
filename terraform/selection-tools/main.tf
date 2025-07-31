terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }
  backend "s3" {
    bucket = "graphics-app-selection-tools-terraform"
    key    = "selection-tools/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Selection-Tools"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Component   = "Selection-Tools"
    }
  }
}

# VPC for Selection Tools
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "selection-tools-vpc-${var.environment}"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway = true
  single_nat_gateway = var.environment == "staging"
  enable_vpn_gateway = false

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

# EKS Cluster for Selection Tools
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "selection-tools-cluster-${var.environment}"
  cluster_version = "1.28"

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    selection_tools = {
      desired_capacity = var.node_group_desired_capacity
      min_capacity     = var.node_group_min_capacity
      max_capacity     = var.node_group_max_capacity

      instance_types = var.node_group_instance_types
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment
        NodeGroup   = "selection-tools"
        Component   = "Selection-Tools"
      }

      tags = {
        ExtraTag = "selection-tools-node-group"
      }
    }
  }

  cluster_security_group_additional_rules = {
    ingress_nodes_443 = {
      description                = "Node groups to cluster API"
      protocol                  = "tcp"
      port                      = 443
      source_node_security_group = true
    }
  }

  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      self        = true
    }
  }

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

# Application Load Balancer
resource "aws_lb" "selection_tools" {
  name               = "selection-tools-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

resource "aws_lb_target_group" "frontend" {
  name     = "selection-tools-frontend-${var.environment}"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

resource "aws_lb_target_group" "backend" {
  name     = "selection-tools-backend-${var.environment}"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

resource "aws_lb_target_group" "ai_services" {
  name     = "selection-tools-ai-${var.environment}"
  port     = 8001
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.selection_tools.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.selection_tools.arn
  port              = "5000"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

resource "aws_lb_listener" "ai_services" {
  load_balancer_arn = aws_lb.selection_tools.arn
  port              = "8001"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ai_services.arn
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "selection-tools-alb-${var.environment}"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "selection-tools-alb-${var.environment}"
    Component = "Selection-Tools"
  }
}

# RDS Database for Selection Tools
resource "aws_db_subnet_group" "selection_tools" {
  name       = "selection-tools-db-subnet-${var.environment}"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "selection-tools-rds-${var.environment}"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "selection-tools-rds-${var.environment}"
    Component = "Selection-Tools"
  }
}

resource "aws_db_instance" "selection_tools" {
  identifier = "selection-tools-db-${var.environment}"

  engine         = "postgres"
  engine_version = "14.9"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true

  db_name  = "selection_tools"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.selection_tools.name

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = var.environment == "staging"

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

# Redis for Caching
resource "aws_elasticache_subnet_group" "selection_tools" {
  name       = "selection-tools-redis-subnet-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "redis" {
  name_prefix = "selection-tools-redis-${var.environment}"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "selection-tools-redis-${var.environment}"
    Component = "Selection-Tools"
  }
}

resource "aws_elasticache_cluster" "selection_tools" {
  cluster_id           = "selection-tools-redis-${var.environment}"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.selection_tools.name

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

# S3 Buckets for Selection Tools
resource "aws_s3_bucket" "selection_tools_assets" {
  bucket = "selection-tools-assets-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
    Purpose     = "Assets Storage"
  }
}

resource "aws_s3_bucket_versioning" "selection_tools_assets" {
  bucket = aws_s3_bucket.selection_tools_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "selection_tools_assets" {
  bucket = aws_s3_bucket.selection_tools_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "selection_tools_assets" {
  bucket = aws_s3_bucket.selection_tools_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "selection_tools" {
  name              = "/aws/eks/selection-tools-${var.environment}/application"
  retention_in_days = var.environment == "production" ? 90 : 30

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

# WAF for Security
resource "aws_wafv2_web_acl" "selection_tools" {
  name        = "selection-tools-waf-${var.environment}"
  description = "WAF for Selection Tools"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "SelectionToolsCommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "SelectionToolsRateLimit"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "SelectionToolsRateLimitMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "SelectionToolsWAFMetric"
    sampled_requests_enabled  = true
  }

  tags = {
    Environment = var.environment
    Component   = "Selection-Tools"
  }
}

# Random string for bucket names
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "node_group_desired_capacity" {
  description = "Desired capacity for node group"
  type        = number
  default     = 2
}

variable "node_group_min_capacity" {
  description = "Minimum capacity for node group"
  type        = number
  default     = 1
}

variable "node_group_max_capacity" {
  description = "Maximum capacity for node group"
  type        = number
  default     = 5
}

variable "node_group_instance_types" {
  description = "Instance types for node group"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "RDS max allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "selection_tools_admin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

# Outputs
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = aws_lb.selection_tools.dns_name
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.selection_tools.endpoint
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_cluster.selection_tools.cache_nodes.0.address
}

output "s3_bucket_name" {
  description = "S3 bucket name for assets"
  value       = aws_s3_bucket.selection_tools_assets.bucket
} 