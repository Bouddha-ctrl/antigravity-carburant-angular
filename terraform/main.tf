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

# Optional: CloudFront distribution for CDN
resource "aws_cloudfront_distribution" "website" {
  count   = var.enable_cloudfront ? 1 : 0
  enabled = true

  origin {
    domain_name = module.website_bucket.bucket_regional_domain_name
    origin_id   = "S3-bouddha-angular-files"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-bouddha-angular-files"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
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
    Name        = "${var.project_name}-cdn"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Optional: CloudFront invalidation policy for GitHub Actions
resource "aws_iam_user_policy" "github_actions_cloudfront" {
  count = var.enable_cloudfront ? 1 : 0
  name  = "${var.project_name}-cloudfront-invalidate"
  user  = aws_iam_user.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation"
        ]
        Resource = aws_cloudfront_distribution.website[0].arn
      }
    ]
  })
}
