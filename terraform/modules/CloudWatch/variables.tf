# variables.tf
variable "application_name" {
  description = "Name of the application"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9-]+$", var.application_name))
    error_message = "Application name must be alphanumeric with hyphens (e.g., my-app-1)."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Invalid log retention period. Must be one of: 1, 3, 5, 7, 14, 30, ..., 3653."
  }
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "Must be a valid email address (e.g., alerts@company.com)."
  }
}

variable "webhook_url" {
  description = "Webhook URL for Slack/Teams notifications"
  type        = string
  default     = ""
  validation {
    condition     = var.webhook_url == "" || can(regex("^https://", var.webhook_url))
    error_message = "webhook_url must be empty or a valid HTTPS URL (e.g., Slack/Teams webhook)."
  }
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster (optional)"
  type        = string
  default     = ""
}

variable "alb_name" {
  description = "Name of the Application Load Balancer (optional)"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "cloudwatch-monitoring"
    ManagedBy   = "terraform"
    Owner       = "jaga"
  }
}