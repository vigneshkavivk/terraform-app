terraform {
  backend "s3" {
    bucket         = "cloudmasa-terraform-states-9819167784209208"
    key            = "cloudwatch/deployments/dep-1762845494056/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

module "cloudwatch" {
  source               = "../../modules/CloudWatch"
  application_name     = "cloudmasa-app"
  alert_email          = "alerts@cloudmasa.example.com"
  log_retention_days   = 14
  aws_region           = "us-east-1"
  # ecs_cluster_name not provided
  # alb_name not provided

  common_tags = {
    Environment = "prod"
    Project     = "cloudmasa"
    Owner       = "jaga"
    ManagedBy   = "terraform"
  }
}
