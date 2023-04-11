resource "aws_iam_role" "iam_for_ecs_exec" {
  name                = join("-", ["ecs-exec", var.stage_name])
  managed_policy_arns = [var.role_s3_arn, var.role_ecr_arn, var.role_ecs_task_arn]
  assume_role_policy  = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

  inline_policy {
    name = "full_cloudwatch_log"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = ["logs:*"]
          Effect   = "Allow"
          Resource = "*"
        }
      ]
    })
  }

  inline_policy {
    name = "SSM_Messages_Full"
    policy = jsonencode({
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Sid" : "VisualEditor0",
          "Effect" : "Allow",
          "Action" : "ssmmessages:*",
          "Resource" : "*"
        }
      ]
    })
  }
  inline_policy {
    name = "Secrets_Manager_Full"
    policy = jsonencode({
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Sid" : "VisualEditor0",
          "Effect" : "Allow",
          "Action" : "secretsmanager:*",
          "Resource" : "*"
        }
      ]
    })
  }
}