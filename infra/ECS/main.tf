resource "aws_ecr_repository" "backend" {
  name = join("-", ["backend", var.stage_name])
}

resource "aws_cloudwatch_log_group" "backend" {
  name = join("-", ["backend", var.stage_name])
}

resource "aws_ecs_task_definition" "backend" {
  family       = join("-", ["backend", var.stage_name])
  skip_destroy = true
  container_definitions = jsonencode([
    {
      name      = join("-", ["backend", var.stage_name])
      image     = var.ecr_image_backend
      essential = true
      portMappings = [{
        containerPort = 80
        hostPort      = 80
        protocol      = "tcp"
      }]
      logConfiguration = {
        "logDriver"     = "awslogs"
        "secretOptions" = null
        "options" = {
          awslogs-group         = join("-", ["backend", var.stage_name])
          awslogs-region        = "ap-southeast-1"
          awslogs-stream-prefix = "ecs"
        }
      }
      environment : [],
      secrets = [
        {
          name      = "USER_NAME_DATABASE"
          valueFrom = join(":", [var.secrets_manager_arn, "USER_NAME_DATABASE::"])
        },
        {
          name      = "PASSWORD_DATABASE"
          valueFrom = join(":", [var.secrets_manager_arn, "PASSWORD_DATABASE::"])
        },
        {
          name      = "ENDPOINT_DATABASE"
          valueFrom = join(":", [var.secrets_manager_arn, "ENDPOINT_DATABASE::"])
        },
        {
          name      = "PORT_DATABASE"
          valueFrom = join(":", [var.secrets_manager_arn, "PORT_DATABASE::"])
        },
        {
          name      = "NAME_DATABASE"
          valueFrom = join(":", [var.secrets_manager_arn, "NAME_DATABASE::"])
        },
        {
          name      = "BASE_URL"
          valueFrom = join(":", [var.secrets_manager_arn, "BASE_URL::"])
        },
        {
          name      = "DATABASE_LOGGING"
          valueFrom = join(":", [var.secrets_manager_arn, "DATABASE_LOGGING::"])
        },
        {
          name      = "DATABASE_ENTITIES"
          valueFrom = join(":", [var.secrets_manager_arn, "DATABASE_ENTITIES::"])
        },
        {
          name      = "DATABASE_MIGRATIONS"
          valueFrom = join(":", [var.secrets_manager_arn, "DATABASE_MIGRATIONS::"])
        },
        {
          name      = "DATABASE_MIGRATIONS_TABLE_NAME"
          valueFrom = join(":", [var.secrets_manager_arn, "DATABASE_MIGRATIONS_TABLE_NAME::"])
        },
        {
          name      = "COINGECKO_API_KEY"
          valueFrom = join(":", [var.secrets_manager_arn, "COINGECKO_API_KEY::"])
        },
        {
          name      = "ETHERSCAN_API_KEY"
          valueFrom = join(":", [var.secrets_manager_arn, "ETHERSCAN_API_KEY::"])
        },
        {
          name      = "ALCHEMY_INGESTION_API_KEY"
          valueFrom = join(":", [var.secrets_manager_arn, "ALCHEMY_INGESTION_API_KEY::"])
        },
        {
          name      = "POLYGONSCAN_API_KEY"
          valueFrom = join(":", [var.secrets_manager_arn, "POLYGONSCAN_API_KEY::"])
        },
        {
          name      = "BSCSCAN_API_KEY"
          valueFrom = join(":", [var.secrets_manager_arn, "BSCSCAN_API_KEY::"])
        },
        {
          name      = "AWS_S3_BUCKET"
          valueFrom = join(":", [var.secrets_manager_arn, "AWS_S3_BUCKET::"])
        },
        {
          name      = "AWS_S3_ACCESS_KEY"
          valueFrom = join(":", [var.secrets_manager_arn, "AWS_S3_ACCESS_KEY::"])
        },
        {
          name      = "AWS_S3_KEY_SECRET"
          valueFrom = join(":", [var.secrets_manager_arn, "AWS_S3_KEY_SECRET::"])
        },
        {
          name      = "AWS_S3_REGION"
          valueFrom = join(":", [var.secrets_manager_arn, "AWS_S3_REGION::"])
        },
        {
          name      = "S3_URL"
          valueFrom = join(":", [var.secrets_manager_arn, "S3_URL::"])
        },
        {
          name      = "VAULT_URL"
          valueFrom = join(":", [var.secrets_manager_arn, "VAULT_URL::"])
        },
        {
          name      = "VAULT_VERSION"
          valueFrom = join(":", [var.secrets_manager_arn, "VAULT_VERSION::"])
        },
        {
          name      = "VAULT_ROLE_ID"
          valueFrom = join(":", [var.secrets_manager_arn, "VAULT_ROLE_ID::"])
        },
        {
          name      = "VAULT_SECRET_ID"
          valueFrom = join(":", [var.secrets_manager_arn, "VAULT_SECRET_ID::"])
        },
        {
          name      = "VAULT_NAMESPACE"
          valueFrom = join(":", [var.secrets_manager_arn, "VAULT_NAMESPACE::"])
        },
        {
          name      = "VAULT_ENV"
          valueFrom = join(":", [var.secrets_manager_arn, "VAULT_ENV::"])
        },
        {
          name      = "PORT"
          valueFrom = join(":", [var.secrets_manager_arn, "PORT::"])
        },
        {
          name      = "AUTH0_AUDIENCE"
          valueFrom = join(":", [var.secrets_manager_arn, "AUTH0_AUDIENCE::"])
        },
        {
          name      = "AUTH0_ISSUER_URL"
          valueFrom = join(":", [var.secrets_manager_arn, "AUTH0_ISSUER_URL::"])
        },
        {
          name      = "PUBLIC_AWS_S3_BUCKET"
          valueFrom = join(":", [var.secrets_manager_arn, "PUBLIC_AWS_S3_BUCKET::"])
        },
        {
          name      = "PRIVATE_AWS_S3_BUCKET"
          valueFrom = join(":", [var.secrets_manager_arn, "PRIVATE_AWS_S3_BUCKET::"])
        }
      ]
    }
  ])
  memory                   = 2048
  cpu                      = 1024
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  execution_role_arn       = var.ecs_task_role_arn
  task_role_arn            = var.ecs_task_role_arn
}

resource "aws_ecs_cluster" "fs-evm" {
  name = join("-", ["fs-evm", var.stage_name])
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_service" "backend" {
  name                   = "backend"
  cluster                = aws_ecs_cluster.fs-evm.id
  task_definition        = aws_ecs_task_definition.backend.arn
  desired_count          = 1
  enable_execute_command = true
  launch_type            = "FARGATE"
  network_configuration {
    subnets          = var.stage_name == "dev" ? [var.subnet_public_1_id, var.subnet_public_2_id] : [var.subnet_private_1_id, var.subnet_private_2_id]
    security_groups  = [var.security_group_ecs_backend_id]
    assign_public_ip = var.stage_name == "dev" ? true : false
  }
  service_registries {
    registry_arn   = var.cloudmap_backend_arn
    container_port = 80
    container_name = join("-", ["backend", var.stage_name])
  }
  wait_for_steady_state = true
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

}

