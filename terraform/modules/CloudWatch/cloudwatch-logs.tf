resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ecs/${var.application_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn
  tags              = merge(var.common_tags, { Purpose = "application-logs" })
}

resource "aws_cloudwatch_log_group" "system" {
  name              = "/aws/system/${var.application_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn
  tags              = merge(var.common_tags, { Purpose = "system-logs" })
}