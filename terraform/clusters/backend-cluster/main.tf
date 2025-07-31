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
  }
  backend "s3" {
    bucket = "graphics-app-backend-terraform-state"
    key    = "backend-cluster/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Graphics-App-Backend"
      Environment = var.environment
      Cluster     = "backend"
      ManagedBy   = "Terraform"
      Team        = "Backend-Cluster"
    }
  }
}

# Backend EKS Cluster
module "backend_eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "graphics-backend-cluster-${var.environment}"
  cluster_version = "1.28"

  cluster_endpoint_public_access = true
  cluster_endpoint_private_access = true

  vpc_id     = data.aws_vpc.main.id
  subnet_ids = data.aws_subnets.private.ids

  eks_managed_node_groups = {
    backend = {
      desired_capacity = 2
      min_capacity     = 1
      max_capacity     = 5

      instance_types = ["t3.medium", "t3.large"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment
        NodeGroup   = "backend"
        Cluster     = "backend"
      }

      taints = []

      tags = {
        ExtraTag = "backend-node-group"
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
    Cluster     = "backend"
    Purpose     = "Backend API Services"
  }
}

# RDS PostgreSQL Database
module "backend_rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "graphics-backend-db-${var.environment}"

  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  max_allocated_storage = 100

  db_name  = "graphics_backend_db"
  username = var.db_username
  port     = "5432"

  vpc_security_group_ids = [aws_security_group.backend_rds.id]
  subnet_ids             = data.aws_subnets.private.ids

  create_db_subnet_group = true

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
    Cluster     = "backend"
    Purpose     = "Backend Database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "backend_redis" {
  name       = "graphics-backend-redis-${var.environment}"
  subnet_ids = data.aws_subnets.private.ids
}

resource "aws_elasticache_cluster" "backend_redis" {
  cluster_id           = "graphics-backend-redis-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.backend_redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.backend_redis.name

  tags = {
    Environment = var.environment
    Cluster     = "backend"
  }
}

# Backend Application Load Balancer
resource "aws_lb" "backend" {
  name               = "graphics-backend-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.backend_alb.id]
  subnets            = data.aws_subnets.public.ids

  enable_deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
    Cluster     = "backend"
    Purpose     = "Backend Load Balancer"
  }
}

resource "aws_lb_target_group" "backend" {
  name     = "graphics-backend-tg-${var.environment}"
  port     = 8000
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.main.id

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
    Cluster     = "backend"
  }
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.backend.arn
  port              = "8000"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# Backend Security Groups
resource "aws_security_group" "backend_alb" {
  name_prefix = "graphics-backend-alb-${var.environment}"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port   = 8000
    to_port     = 8000
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
    Name = "graphics-backend-alb-${var.environment}"
    Cluster = "backend"
  }
}

resource "aws_security_group" "backend_rds" {
  name_prefix = "graphics-backend-rds-${var.environment}"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.backend_eks.cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "graphics-backend-rds-${var.environment}"
    Cluster = "backend"
  }
}

resource "aws_security_group" "backend_redis" {
  name_prefix = "graphics-backend-redis-${var.environment}"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.backend_eks.cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "graphics-backend-redis-${var.environment}"
    Cluster = "backend"
  }
}

# Backend WAF
resource "aws_wafv2_web_acl" "backend" {
  name        = "graphics-backend-waf-${var.environment}"
  description = "WAF for Backend Cluster"
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
      metric_name               = "BackendCommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "BackendRateLimit"
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
      metric_name               = "BackendRateLimitMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "BackendWAFMetric"
    sampled_requests_enabled  = true
  }

  tags = {
    Environment = var.environment
    Cluster     = "backend"
  }
}

# Backend CloudWatch Log Group
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/eks/graphics-backend-${var.environment}/application"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Cluster     = "backend"
  }
}

# Data Sources
data "aws_vpc" "main" {
  tags = {
    Name = "graphics-app-vpc-${var.environment}"
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  
  tags = {
    Type = "private"
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  
  tags = {
    Type = "public"
  }
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

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

# Outputs
output "backend_cluster_endpoint" {
  description = "Endpoint for Backend EKS control plane"
  value       = module.backend_eks.cluster_endpoint
}

output "backend_cluster_security_group_id" {
  description = "Security group ID attached to the Backend EKS cluster"
  value       = module.backend_eks.cluster_security_group_id
}

output "backend_load_balancer_dns" {
  description = "Backend load balancer DNS name"
  value       = aws_lb.backend.dns_name
}

output "backend_rds_endpoint" {
  description = "Backend RDS endpoint"
  value       = module.backend_rds.db_instance_endpoint
}

output "backend_redis_endpoint" {
  description = "Backend Redis endpoint"
  value       = aws_elasticache_cluster.backend_redis.cache_nodes.0.address
} 