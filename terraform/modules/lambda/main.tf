##############################################
# ✅ Required Providers
##############################################
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

##############################################
# 🧩 IAM Role (reuse existing or create new)
##############################################
data "aws_iam_role" "existing_lambda_role" {
  name = "lambda-role-${var.lambda_function_name}-${var.environment}"
}

resource "aws_iam_role" "lambda_exec_role" {
  count = length(data.aws_iam_role.existing_lambda_role) > 0 ? 0 : 1

  name = "lambda-role-${var.lambda_function_name}-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Environment = var.environment
    Function    = var.lambda_function_name
  }

  lifecycle {
    prevent_destroy = true
  }
}

# ✅ FIXED: single-line locals, no line breaks, no .*.id
locals {
  lambda_role_name = length(data.aws_iam_role.existing_lambda_role) > 0 ? data.aws_iam_role.existing_lambda_role.name : aws_iam_role.lambda_exec_role[0].name
  lambda_role_arn  = length(data.aws_iam_role.existing_lambda_role) > 0 ? data.aws_iam_role.existing_lambda_role.arn  : aws_iam_role.lambda_exec_role[0].arn
}

##############################################
# 📊 CloudWatch Log Group
##############################################
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Environment = var.environment
    Function    = var.lambda_function_name
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [retention_in_days]
  }
}

##############################################
# 📜 IAM Policies — ✅ BOTH use .name (role NAME, not ARN)
##############################################
resource "aws_iam_role_policy" "lambda_policy" {
  name = "lambda-cw-policy-${var.lambda_function_name}"
  role = local.lambda_role_name  # ✅ fixed: .name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:/aws/lambda/${var.lambda_function_name}*"
    }]
  })
}

resource "aws_iam_role_policy" "dynamodb" {
  count = var.dynamodb_table_name != "" ? 1 : 0
  name  = "lambda-dynamodb-${var.lambda_function_name}"
  role  = local.lambda_role_name  # ✅ fixed: .name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DescribeTable"
      ]
      Resource = var.dynamodb_table_arn
    }]
  })
}

##############################################
# 📦 Lambda ZIP Packaging
##############################################
resource "null_resource" "validate_lambda" {
  count = var.validate_lambda_code ? 1 : 0

  triggers = {
    source_file = fileexists("${path.module}/lambda_function.py") ? filemd5("${path.module}/lambda_function.py") : ""
  }

  provisioner "local-exec" {
    command = "python3 -m py_compile ${path.module}/lambda_function.py"
    interpreter = ["bash", "-c"]
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function_payload.zip"

  lifecycle {
    precondition {
      condition     = fileexists("${path.module}/lambda_function.py")
      error_message = "❌ lambda_function.py not found in module directory!"
    }
  }

  depends_on = [null_resource.validate_lambda]
}

##############################################
# ⚡ AWS Lambda Function — ✅ role = ARN (correct), no invalid lifecycle
##############################################
resource "aws_lambda_function" "s3_processor" {
  function_name = var.lambda_function_name
  runtime       = var.lambda_runtime
  handler       = var.lambda_handler
  role          = local.lambda_role_arn  # ✅ ARN is correct here

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = var.lambda_timeout

  environment {
    variables = {
      ENVIRONMENT         = var.environment
      DYNAMODB_TABLE_NAME = var.dynamodb_table_name != "" ? var.dynamodb_table_name : null
    }
  }

  tags = {
    Environment = var.environment
    Terraform   = "true"
  }

  # ✅ REMOVED: ignore_changes = [last_modified] → causes warning & unnecessary
  # ✅ REMOVED: replace_triggered_by → invalid syntax

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

##############################################
# 🔌 Lambda + S3 Integration (optional)
##############################################
resource "aws_lambda_permission" "allow_s3" {
  count = var.s3_bucket_name != "" ? 1 : 0

  statement_id   = "AllowS3Invoke-${var.lambda_function_name}"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.s3_processor.function_name
  principal      = "s3.amazonaws.com"
  source_arn     = var.s3_bucket_arn
  source_account = var.account_id
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  count = var.s3_bucket_name != "" ? 1 : 0

  bucket = var.s3_bucket_name

  lambda_function {
    lambda_function_arn = aws_lambda_function.s3_processor.arn
    events              = var.s3_events
  }

  depends_on = [aws_lambda_permission.allow_s3]
}