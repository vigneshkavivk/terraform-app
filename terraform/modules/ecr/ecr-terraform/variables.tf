# variables.tf
variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "ecr_repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "my-app-ecr"
}

variable "image_tag_mutability" {
  description = "Tag mutability setting for the ECR repository"
  type        = string
  default     = "MUTABLE"
  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "Tag mutability must be either MUTABLE or IMMUTABLE."
  }
}

variable "scan_on_push" {
  description = "Whether to scan images on push"
  type        = bool
  default     = true
}

variable "encryption_type" {
  description = "Encryption type for ECR repository"
  type        = string
  default     = "AES256"
}

variable "keep_last_images" {
  description = "Number of images to keep in the repository"
  type        = number
  default     = 30
}

variable "untagged_image_expiry_days" {
  description = "Number of days to keep untagged images"
  type        = number
  default     = 7
}

variable "ecr_access_principals" {
  description = "List of ARNs that can access the ECR repository"
  type        = list(string)
  default     = ["*"]
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "development"
    Project     = "my-project"
    Terraform   = "true"
  }
}
