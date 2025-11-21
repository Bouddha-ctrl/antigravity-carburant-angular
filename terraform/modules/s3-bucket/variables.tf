variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "block_public_access" {
  description = "Block public access to bucket"
  type        = bool
  default     = true
}

variable "enable_versioning" {
  description = "Enable bucket versioning"
  type        = bool
  default     = false
}

variable "index_document" {
  description = "Index document for website"
  type        = string
  default     = "index.html"
}

variable "error_document" {
  description = "Error document for website"
  type        = string
  default     = "index.html"
}

variable "bucket_policy" {
  description = "Bucket policy JSON"
  type        = string
}

variable "cors_rules" {
  description = "CORS rules"
  type        = list(any)
  default     = []
}
