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
    bucket = "graphics-app-frontend-terraform-state"
    key    = "frontend-cluster/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Graphics-App-Frontend"
      Environment = var.environment
      Cluster     = "frontend"
      ManagedBy   = "Terraform"
      Team        = "Frontend-Cluster"
    }
  }
}

# Frontend EKS Cluster
module "frontend_eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "graphics-frontend-cluster-${var.environment}"
  cluster_version = "1.28"

  cluster_endpoint_public_access = true
  cluster_endpoint_private_access = true

  vpc_id     = data.aws_vpc.main.id
  subnet_ids = data.aws_subnets.private.ids

  eks_managed_node_groups = {
    frontend = {
      desired_capacity = 2
      min_capacity     = 1
      max_capacity     = 5

      instance_types = ["t3.medium", "t3.large"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment
        NodeGroup   = "frontend"
        Cluster     = "frontend"
      }

      taints = []

      tags = {
        ExtraTag = "frontend-node-group"
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
    Cluster     = "frontend"
    Purpose     = "Frontend Graphics Application"
  }
}

# Frontend Application Load Balancer
resource "aws_lb" "frontend" {
  name               = "graphics-frontend-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.frontend_alb.id]
  subnets            = data.aws_subnets.public.ids

  enable_deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
    Cluster     = "frontend"
    Purpose     = "Frontend Load Balancer"
  }
}

resource "aws_lb_target_group" "frontend" {
  name     = "graphics-frontend-tg-${var.environment}"
  port     = 3000
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
    Cluster     = "frontend"
  }
}

resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.frontend.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# Frontend Security Groups
resource "aws_security_group" "frontend_alb" {
  name_prefix = "graphics-frontend-alb-${var.environment}"
  vpc_id      = data.aws_vpc.main.id

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
    Name = "graphics-frontend-alb-${var.environment}"
    Cluster = "frontend"
  }
}

# Frontend WAF
resource "aws_wafv2_web_acl" "frontend" {
  name        = "graphics-frontend-waf-${var.environment}"
  description = "WAF for Frontend Cluster"
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
      metric_name               = "FrontendCommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "FrontendRateLimit"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 3000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "FrontendRateLimitMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "FrontendWAFMetric"
    sampled_requests_enabled  = true
  }

  tags = {
    Environment = var.environment
    Cluster     = "frontend"
  }
}

# Frontend CloudWatch Log Group
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/aws/eks/graphics-frontend-${var.environment}/application"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Cluster     = "frontend"
  }
}

# Frontend S3 Bucket for Assets
resource "aws_s3_bucket" "frontend_assets" {
  bucket = "graphics-frontend-assets-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Environment = var.environment
    Cluster     = "frontend"
  }
}

resource "aws_s3_bucket_versioning" "frontend_assets" {
  bucket = aws_s3_bucket.frontend_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_assets" {
  bucket = aws_s3_bucket.frontend_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_assets" {
  bucket = aws_s3_bucket.frontend_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Frontend CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket.frontend_assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend_assets.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_assets.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Environment = var.environment
    Cluster     = "frontend"
  }
}

resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "OAI for frontend assets"
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

# Outputs
output "frontend_cluster_endpoint" {
  description = "Endpoint for Frontend EKS control plane"
  value       = module.frontend_eks.cluster_endpoint
}

output "frontend_cluster_security_group_id" {
  description = "Security group ID attached to the Frontend EKS cluster"
  value       = module.frontend_eks.cluster_security_group_id
}

output "frontend_load_balancer_dns" {
  description = "Frontend load balancer DNS name"
  value       = aws_lb.frontend.dns_name
}

output "frontend_s3_bucket_name" {
  description = "Frontend S3 bucket name for assets"
  value       = aws_s3_bucket.frontend_assets.bucket
}

output "frontend_cloudfront_distribution_id" {
  description = "Frontend CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
} 