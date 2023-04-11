variable "ecr_image_backend" {
  description = "Image of backend container"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "Task role ECS"
  type        = string
}

variable "secrets_manager_arn" {
  type = string
}

variable "subnet_public_1_id" {
  type = string
}

variable "subnet_public_2_id" {
  type = string
}

variable "security_group_ecs_backend_id" {
  type = string
}

variable "cloudmap_backend_arn" {
  type = string
}

variable "stage_name" {
  description = "Name of the stage"
}

variable "subnet_private_1_id" {
  type = string
}

variable "subnet_private_2_id" {
  type = string
}