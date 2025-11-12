resource "aws_kms_key" "cloudwatch" {
  description         = "KMS key for encrypting ${var.application_name} CloudWatch logs"
  enable_key_rotation = true
  tags                = var.common_tags
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/cloudwatch-${var.application_name}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}