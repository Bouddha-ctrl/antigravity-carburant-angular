output "bucket_name" {
  description = "S3 bucket name"
  value       = module.website_bucket.bucket_id
}

output "website_url" {
  description = "Website URL"
  value       = "http://${module.website_bucket.website_endpoint}"
}
