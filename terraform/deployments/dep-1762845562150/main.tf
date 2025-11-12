terraform {
  backend "s3" {
    bucket         = "cloudmasa-terraform-states-9819167784209208"
    key            = "ecr/deployments/dep-1762845562150/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

module "ecr" {
  source                 = "../../modules/ecr-terraform"
  ecr_repository_name       = "fgh"
  image_tag_mutability   = "MUTABLE"
  scan_on_push           = true
}

