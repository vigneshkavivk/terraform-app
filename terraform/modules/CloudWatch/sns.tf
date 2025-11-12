resource "aws_sns_topic" "cloudwatch_alerts" {
  name = "${var.application_name}-alerts"
  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "email_alert" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.cloudwatch_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "webhook_alert" {
  count     = var.webhook_url != "" ? 1 : 0
  topic_arn = aws_sns_topic.cloudwatch_alerts.arn
  protocol  = "https"
  endpoint  = var.webhook_url

  # Optional: confirmation timeout (for dev)
  # endpoint_auto_confirms = true  # ⚠️ Only for trusted endpoints
}