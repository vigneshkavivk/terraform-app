resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count               = var.ecs_cluster_name != "" && var.application_name != "" ? 1 : 0
  alarm_name          = "${var.application_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS Service CPU > 80%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  ok_actions          = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.application_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  count               = var.ecs_cluster_name != "" && var.application_name != "" ? 1 : 0
  alarm_name          = "${var.application_name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS Service Memory > 85%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  ok_actions          = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.application_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_5xx" {
  count               = var.alb_name != "" ? 1 : 0
  alarm_name          = "${var.application_name}-high-5xx"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "ALB 5XX errors ≥ 5/min"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  ok_actions          = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  count               = var.alb_name != "" ? 1 : 0
  alarm_name          = "${var.application_name}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 2.0
  alarm_description   = "ALB avg response time > 2s"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  ok_actions          = [aws_sns_topic.cloudwatch_alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_name
  }
}