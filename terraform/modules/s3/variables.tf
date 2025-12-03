variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "bucket_name_prefix" {
  description = "Prefix for S3 bucket name (must be globally unique)"
  type        = string
  validation {
    condition     = length(var.bucket_name_prefix) >= 3 && length(var.bucket_name_prefix) <= 20
    error_message = "Bucket prefix must be 3–20 characters long."
  }
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}
variable "storage_class" {
  type        = string
  default     = "STANDARD"
  validation {
    condition     = contains(["STANDARD", "INTELLIGENT_TIERING", "GLACIER"], var.storage_class)
    error_message = "Valid storage classes: STANDARD, INTELLIGENT_TIERING, GLACIER."
  }
}

variable "force_destroy" {
  type        = bool
  default     = false
}
