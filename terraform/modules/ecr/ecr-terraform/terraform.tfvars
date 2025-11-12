# terraform.tfvars
ecr_repository_name         = "my-production-ecr"
image_tag_mutability        = "IMMUTABLE"
scan_on_push               = true
keep_last_images           = 50
untagged_image_expiry_days = 3
aws_region                 = "us-east-1"

common_tags = {
  Environment = "production"
  Project     = "my-app"
  Team        = "devops"
  Terraform   = "true"
}

ecr_access_principals = [
  "arn:aws:iam::123456789012:user/ci-cd-user",
  "arn:aws:iam::123456789012:role/eks-node-group"
]
