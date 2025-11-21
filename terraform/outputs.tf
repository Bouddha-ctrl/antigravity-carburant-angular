output "bucket_name" {
  description = "S3 bucket name"
  value       = module.website_bucket.bucket_id
}

output "website_url" {
  description = "Website URL"
  value       = "http://${module.website_bucket.website_endpoint}"
}

output "github_actions_user" {
  description = "IAM user for GitHub Actions"
  value       = aws_iam_user.github_actions.name
}

output "github_actions_user_arn" {
  description = "IAM user ARN for GitHub Actions"
  value       = aws_iam_user.github_actions.arn
}
