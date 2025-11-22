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
  value       = module.cloudfront.distribution_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = module.cloudfront.distribution_id
}
