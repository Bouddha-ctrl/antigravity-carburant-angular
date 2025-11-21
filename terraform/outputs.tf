output "bucket_name" {
  description = "S3 bucket name"
  value       = module.website_bucket.bucket_id
}

output "website_url" {
  description = "Website URL"
  value       = "http://${module.website_bucket.website_endpoint}"
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.website[0].domain_name}" : "N/A - CloudFront not enabled"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.website[0].id : "N/A"
}

output "github_actions_user" {
  description = "IAM user for GitHub Actions"
  value       = aws_iam_user.github_actions.name
}

output "github_actions_user_arn" {
  description = "IAM user ARN for GitHub Actions"
  value       = aws_iam_user.github_actions.arn
}
