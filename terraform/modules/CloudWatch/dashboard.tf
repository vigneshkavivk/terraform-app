resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.application_name}-dashboard"
  dashboard_body = jsonencode({
    widgets = [
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

      # Info widget — safe way to show "tags"
      {
        type   = "text"
        x      = 0
        y      = 12
        width  = 12
        height = 3
        properties = {
          markdown = <<-EOT
🏷️ **Metadata**
• Env: `${var.common_tags.Environment}`
• Project: `${var.common_tags.Project}`
• Owner: `${var.common_tags.Owner}`
• ManagedBy: `${var.common_tags.ManagedBy}`
• App: `${var.application_name}`
          EOT
        }
      }
    ]
  })
}