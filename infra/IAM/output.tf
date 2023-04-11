output "ecs_task_role_arn" {
  value = aws_iam_role.iam_for_ecs_exec.arn
}