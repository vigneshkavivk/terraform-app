# kms.tf (or inside main.tf)
resource "aws_kms_key" "cloudwatch" {
  description         = "KMS key for encrypting ${var.application_name} CloudWatch logs"
  enable_key_rotation = true
  tags                = var.common_tags
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/cloudwatch-${var.application_name}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# CloudWatch Log Groups
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

# SNS Topic for Alerts
resource "aws_sns_topic" "cloudwatch_alerts" {
  name  = "${var.application_name}-alerts"
  tags  = var.common_tags
}

# Email Subscription (if alert_email provided)
resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.cloudwatch_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Optional: Slack/Teams Webhook via Lambda or SNS-to-HTTP (simplified with SNS HTTP)
resource "aws_sns_topic_subscription" "webhook" {
  count     = var.webhook_url != "" ? 1 : 0
  topic_arn = aws_sns_topic.cloudwatch_alerts.arn
  protocol  = "https"
  endpoint  = var.webhook_url
  # ⚠️ Note: For Slack, webhook must accept SNS payloads or use Lambda proxy
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count               = var.ecs_cluster_name != "" && var.application_name != "" ? 1 : 0
  alarm_name          = "${var.application_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS Service CPU > 80%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  ok_actions          = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    ClusterName  = var.ecs_cluster_name
    ServiceName  = var.application_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  count               = var.ecs_cluster_name != "" && var.application_name != "" ? 1 : 0
  alarm_name          = "${var.application_name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "ECS Service Memory > 85%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  ok_actions          = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    ClusterName  = var.ecs_cluster_name
    ServiceName  = var.application_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  count               = var.alb_name != "" ? 1 : 0
  alarm_name          = "${var.application_name}-high-5xx"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "ALB 5XX errors ≥ 5 per minute"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  ok_actions          = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  count               = var.alb_name != "" ? 1 : 0
  alarm_name          = "${var.application_name}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "2.0"
  alarm_description   = "ALB avg response time > 2s"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  ok_actions          = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_name
  }
}

# 👇 CloudWatch Dashboard — NO `tags` allowed!
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.application_name}-dashboard"
  dashboard_body = jsonencode({
    widgets = compact([
      var.ecs_cluster_name != "" && var.application_name != "" ? {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.application_name, "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Service Metrics"
          period  = 300
        }
      } : null,

      var.alb_name != "" ? {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_name],
            [".", "HTTPCode_Target_5XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "TargetResponseTime", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Load Balancer Metrics"
          period  = 300
        }
      } : null,

      # Optional: Info widget with tags (since dashboard can't have real tags)
      {
        type   = "text"
        x      = 0
        y      = 12
        width  = 12
        height = 2
        properties = {
          markdown = join("\n", [
            "🏷️ **Tags**: ",
            "• Project: `${var.common_tags.Project}`",
            "• Env: `${var.common_tags.Environment}`",
            "• Owner: `${var.common_tags.Owner}`",
            "• ManagedBy: `${var.common_tags.ManagedBy}`"
          ])
        }
      }
    ])
  })
}