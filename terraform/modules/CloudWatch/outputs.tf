output "cloudwatch_log_groups" {
  value = {
    application = aws_cloudwatch_log_group.application.name
    system      = aws_cloudwatch_log_group.system.name
  }
}

output "cloudwatch_dashboard_url" {
  value = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  value = aws_sns_topic.cloudwatch_alerts.arn
}

output "cloudwatch_alarms" {
  value = compact([
    aws_cloudwatch_metric_alarm.high_cpu[count.index].alarm_name,
    aws_cloudwatch_metric_alarm.high_memory[count.index].alarm_name,
    aws_cloudwatch_metric_alarm.high_5xx[count.index].alarm_name,
    aws_cloudwatch_metric_alarm.high_latency[count.index].alarm_name
  ])
}

output "kms_key_arn" {
  value = aws_kms_key.cloudwatch.arn
}