terraform {
  backend "s3" {
    bucket         = "cloudmasa-terraform-states-9819167784209208"
    key            = "cloudwatch/deployments/dep-1762840807294/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

module "cloudwatch" {
  source              = "../../modules/CloudWatch"
  log_group_name      = "log"
  retention_in_days   = 14
  # No KMS encryption specified
  tags = {
    Project     = "cloudmasa"
    Environment = "prod"
    Terraform   = "true"
  }
}

