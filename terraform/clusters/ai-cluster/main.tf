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
    bucket = "graphics-app-ai-terraform-state"
    key    = "ai-cluster/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Graphics-App-AI"
      Environment = var.environment
      Cluster     = "ai"
      ManagedBy   = "Terraform"
      Team        = "AI-Cluster"
    }
  }
}

# AI EKS Cluster with GPU Support
module "ai_eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "graphics-ai-cluster-${var.environment}"
  cluster_version = "1.28"

  cluster_endpoint_public_access = true
  cluster_endpoint_private_access = true

  vpc_id     = data.aws_vpc.main.id
  subnet_ids = data.aws_subnets.private.ids

  eks_managed_node_groups = {
    ai_gpu = {
      desired_capacity = 2
      min_capacity     = 1
      max_capacity     = 5

      instance_types = ["g4dn.xlarge", "g5.xlarge"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment
        NodeGroup   = "ai-gpu"
        Cluster     = "ai"
        Accelerator = "nvidia"
      }

      taints = [{
        key    = "nvidia.com/gpu"
        value  = "present"
        effect = "NO_SCHEDULE"
      }]

      tags = {
        ExtraTag = "ai-gpu-node-group"
      }
    }

    ai_cpu = {
      desired_capacity = 2
      min_capacity     = 1
      max_capacity     = 5

      instance_types = ["t3.large", "t3.xlarge"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment
        NodeGroup   = "ai-cpu"
        Cluster     = "ai"
      }

      taints = []

      tags = {
        ExtraTag = "ai-cpu-node-group"
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
    Cluster     = "ai"
    Purpose     = "AI/ML Services"
  }
}

# AI Application Load Balancer
resource "aws_lb" "ai" {
  name               = "graphics-ai-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ai_alb.id]
  subnets            = data.aws_subnets.public.ids

  enable_deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
    Cluster     = "ai"
    Purpose     = "AI Load Balancer"
  }
}

resource "aws_lb_target_group" "ai" {
  name     = "graphics-ai-tg-${var.environment}"
  port     = 5000
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
    Cluster     = "ai"
  }
}

resource "aws_lb_listener" "ai" {
  load_balancer_arn = aws_lb.ai.arn
  port              = "5000"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ai.arn
  }
}

# AI Security Groups
resource "aws_security_group" "ai_alb" {
  name_prefix = "graphics-ai-alb-${var.environment}"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port   = 5000
    to_port     = 5000
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
    Name = "graphics-ai-alb-${var.environment}"
    Cluster = "ai"
  }
}

# AI S3 Bucket for Models and Datasets
resource "aws_s3_bucket" "ai_models" {
  bucket = "graphics-ai-models-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Environment = var.environment
    Cluster     = "ai"
    Purpose     = "AI Models Storage"
  }
}

resource "aws_s3_bucket_versioning" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "ai_datasets" {
  bucket = "graphics-ai-datasets-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Environment = var.environment
    Cluster     = "ai"
    Purpose     = "AI Datasets Storage"
  }
}

resource "aws_s3_bucket_versioning" "ai_datasets" {
  bucket = aws_s3_bucket.ai_datasets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ai_datasets" {
  bucket = aws_s3_bucket.ai_datasets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "ai_datasets" {
  bucket = aws_s3_bucket.ai_datasets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SageMaker Domain for ML Workbench
resource "aws_sagemaker_domain" "ai" {
  domain_name = "graphics-ai-domain-${var.environment}"
  auth_mode   = "IAM"
  vpc_id      = data.aws_vpc.main.id
  subnet_ids  = data.aws_subnets.private.ids

  default_user_settings {
    execution_role = aws_iam_role.sagemaker_execution_role.arn

    jupyter_server_app_settings {
      default_resource_spec {
        instance_type       = "ml.t3.medium"
        sagemaker_image_arn = data.aws_sagemaker_prebuilt_ecr_image.jupyter.registry_path
      }
    }

    kernel_gateway_app_settings {
      default_resource_spec {
        instance_type       = "ml.t3.medium"
        sagemaker_image_arn = data.aws_sagemaker_prebuilt_ecr_image.kernel.registry_path
      }
    }
  }

  tags = {
    Environment = var.environment
    Cluster     = "ai"
  }
}

# SageMaker IAM Role
resource "aws_iam_role" "sagemaker_execution_role" {
  name = "graphics-ai-sagemaker-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "sagemaker.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Cluster     = "ai"
  }
}

resource "aws_iam_role_policy_attachment" "sagemaker_full_access" {
  role       = aws_iam_role.sagemaker_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
}

# AI WAF
resource "aws_wafv2_web_acl" "ai" {
  name        = "graphics-ai-waf-${var.environment}"
  description = "WAF for AI Cluster"
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
      metric_name               = "AICommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "AIRateLimit"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AIRateLimitMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "AIWAFMetric"
    sampled_requests_enabled  = true
  }

  tags = {
    Environment = var.environment
    Cluster     = "ai"
  }
}

# AI CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ai" {
  name              = "/aws/eks/graphics-ai-${var.environment}/application"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Cluster     = "ai"
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

data "aws_sagemaker_prebuilt_ecr_image" "jupyter" {
  repository_name = "sagemaker-jupyter-server"
  image_tag       = "3"
}

data "aws_sagemaker_prebuilt_ecr_image" "kernel" {
  repository_name = "sagemaker-kernel-gateway"
  image_tag       = "3"
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
output "ai_cluster_endpoint" {
  description = "Endpoint for AI EKS control plane"
  value       = module.ai_eks.cluster_endpoint
}

output "ai_cluster_security_group_id" {
  description = "Security group ID attached to the AI EKS cluster"
  value       = module.ai_eks.cluster_security_group_id
}

output "ai_load_balancer_dns" {
  description = "AI load balancer DNS name"
  value       = aws_lb.ai.dns_name
}

output "ai_models_bucket_name" {
  description = "AI models S3 bucket name"
  value       = aws_s3_bucket.ai_models.bucket
}

output "ai_datasets_bucket_name" {
  description = "AI datasets S3 bucket name"
  value       = aws_s3_bucket.ai_datasets.bucket
}

output "ai_sagemaker_domain_id" {
  description = "AI SageMaker domain ID"
  value       = aws_sagemaker_domain.ai.id
} 