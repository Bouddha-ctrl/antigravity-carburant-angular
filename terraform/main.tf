terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "bouddha-tf-state-angular"
    key            = "fuel-calculator/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "terraform-state-lock-angular"
    encrypt        = true
  }
}

# Create S3 bucket for hosting
module "website_bucket" {
  source = "./modules/s3-bucket"

  bucket_name          = "bouddha-angular-files"
  block_public_access  = false
  enable_versioning    = true
  index_document       = "index.html"
  error_document       = "index.html"

  bucket_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::bouddha-angular-files/*"
      }
    ]
  })

  cors_rules = [
    {
      allowed_headers = ["*"]
      allowed_methods = ["GET", "HEAD"]
      allowed_origins = ["*"]
      expose_headers  = ["ETag"]
      max_age_seconds = 3000
    }
  ]

  tags = {
    Name        = "bouddha-angular-files"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM user for GitHub Actions deployment
resource "aws_iam_user" "github_actions" {
  name = "github-action-angular"
  path = "/ci-cd/"

  tags = {
    Description = "IAM user for GitHub Actions CI/CD"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for S3 deployment
resource "aws_iam_user_policy" "github_actions_s3" {
  name = "${var.project_name}-s3-deploy"
  user = aws_iam_user.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          module.website_bucket.bucket_arn,
          "${module.website_bucket.bucket_arn}/*"
        ]
      }
    ]
  })
}
