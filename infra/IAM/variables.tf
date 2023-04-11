variable "role_s3_arn" {
  default = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

variable "role_ecr_arn" {
  default = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess"
}

variable "role_ecs_task_arn" {
  default = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

variable "stage_name" {
  description = "The name of the stage to deploy to"
}