terraform {
  backend "s3" {
    bucket         = "cloudmasa-terraform-states-9819167784209208"
    key            = "ec2/deployments/dep-1762772186228/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

