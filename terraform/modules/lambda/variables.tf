variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
  # ✅ Optional: auto-detect if not provided
  default     = ""
}

variable "s3_bucket_name" {
  description = "S3 bucket name (leave empty to skip S3 integration)"
  type        = string
  default     = ""
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN"
  type        = string
  default     = ""
}

variable "s3_events" {
  description = "S3 event types to trigger Lambda"
  type        = list(string)
  default     = ["s3:ObjectCreated:*"]
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  type        = string
  default     = ""
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
  default     = ""
}

variable "lambda_function_name" {
  description = "Lambda function name (must be unique)"
  type        = string
  # ✅ Enforce uniqueness in UI
  validation {
    condition = length(var.lambda_function_name) > 0 && can(regex("^[a-zA-Z0-9-_]+$", var.lambda_function_name))
    error_message = "Lambda name must be 1-64 chars, letters, numbers, hyphens, underscores."
  }
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.12"
}

variable "lambda_handler" {
  description = "Lambda handler"
  type        = string
  default     = "lambda_function.lambda_handler"
}

variable "lambda_timeout" {
  description = "Lambda timeout (seconds)"
  type        = number
  default     = 60
}

variable "log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 365
}

# 🔐 Security: Enable code validation in CI/CD, disable in quick-test UI
variable "validate_lambda_code" {
  description = "Validate Python syntax before deploy"
  type        = bool
  default     = true
}