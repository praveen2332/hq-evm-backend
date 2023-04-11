provider "aws" {
  access_key  = var.aws_access_key
  secret_key  = var.aws_secret_key
  region      = var.aws_region
  max_retries = 1
}

terraform {
  backend "s3" {
    key    = "backend-terraform-state/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

module "VPC" {
  source     = "./VPC"
  stage_name = var.stage_name
}

module "RDS" {
  source                     = "./RDS"
  public_subnet_1_id         = module.VPC.subnet_public_1_id
  public_subnet_2_id         = module.VPC.subnet_public_2_id
  database_subnet_2_id       = module.VPC.subnet_database_2_id
  database_subnet_1_id       = module.VPC.subnet_database_1_id
  security_group_database_id = module.VPC.security_group_database_id
  user_name_database         = var.user_name_database
  pass_database              = var.password_database
  stage_name                 = var.stage_name
  private_subnet_1_id        = module.VPC.subnet_private_1_id
  private_subnet_2_id        = module.VPC.subnet_private_2_id
}

module "IAM" {
  source     = "./IAM"
  stage_name = var.stage_name
}

module "SecretsManager" {
  source                    = "./SecretsManager"
  user_name_database        = module.RDS.database_username
  password_database         = module.RDS.database_password
  endpoint_database         = module.RDS.database_endpoint
  name_database             = var.name_database
  stage_name                = var.stage_name
  coingecko_api_key         = var.coingecko_api_key
  etherscan_api_key         = var.etherscan_api_key
  alchemy_ingestion_api_key = var.alchemy_ingestion_api_key
  polygonscan_api_key       = var.polygonscan_api_key
  bscscan_api_key           = var.bscscan_api_key
  aws_s3_bucket             = var.aws_s3_bucket
  aws_s3_access_key         = var.aws_s3_access_key
  aws_s3_key_secret         = var.aws_s3_key_secret
  aws_s3_region             = var.aws_s3_region
  s3_url                    = var.s3_url
  vault_url                 = var.vault_url
  vault_version             = var.vault_version
  vault_role_id             = var.vault_role_id
  vault_secret_id           = var.vault_secret_id
  vault_namespace           = var.vault_namespace
  vault_env                 = var.vault_env
  auth0_audience            = var.auth0_audience
  auth0_issuer_url          = var.auth0_issuer_url
  public_aws_s3_bucket      = var.public_aws_s3_bucket
  private_aws_s3_bucket     = var.private_aws_s3_bucket
}

module "CloudMap" {
  source     = "./CloudMap"
  vpc_id     = module.VPC.vpc_id
  stage_name = var.stage_name
}

module "ECS" {
  depends_on = [
    module.SecretsManager
  ]
  source                        = "./ECS"
  ecr_image_backend             = var.image_backend
  ecs_task_role_arn             = module.IAM.ecs_task_role_arn
  secrets_manager_arn           = module.SecretsManager.secrets_manager_arn
  subnet_public_1_id            = module.VPC.subnet_public_1_id
  subnet_public_2_id            = module.VPC.subnet_public_2_id
  security_group_ecs_backend_id = module.VPC.security_group_ecs_backend_id
  cloudmap_backend_arn          = module.CloudMap.cloudmap_backend_arn
  stage_name                    = var.stage_name
  subnet_private_1_id           = module.VPC.subnet_private_1_id
  subnet_private_2_id           = module.VPC.subnet_private_2_id
}

module "APIGateway" {
  source                             = "./APIGateway"
  security_group_vpc_link_backend_id = module.VPC.security_group_ecs_backend_id
  cloudmap_backend_arn               = module.CloudMap.cloudmap_backend_arn
  subnet_public_1_id                 = module.VPC.subnet_public_1_id
  subnet_public_2_id                 = module.VPC.subnet_public_2_id
  subnet_private_1_id                = module.VPC.subnet_private_1_id
  subnet_private_2_id                = module.VPC.subnet_private_2_id
  stage_name                         = var.stage_name
}
