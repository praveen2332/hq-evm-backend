resource "aws_secretsmanager_secret" "backend" {
  name = join("-", ["secret-backend", var.stage_name])
}

locals {
  tags = {
    user_name_database = var.user_name_database
    password_database  = var.password_database
    endpoint_database  = var.endpoint_database
    port_database      = var.port_database
    name_database      = var.name_database
  }
}

resource "aws_secretsmanager_secret_version" "backend" {
  secret_id = aws_secretsmanager_secret.backend.id
  secret_string = jsonencode({
    USER_NAME_DATABASE             = var.user_name_database
    PASSWORD_DATABASE              = var.password_database
    ENDPOINT_DATABASE              = var.endpoint_database
    PORT_DATABASE                  = var.port_database
    NAME_DATABASE                  = var.name_database
    BASE_URL                       = "http://localhost/api/v1"
    DATABASE_LOGGING               = true
    DATABASE_ENTITIES              = "dist/**/*.entity.js"
    DATABASE_MIGRATIONS            = "dist/migrations/*.js"
    DATABASE_MIGRATIONS_TABLE_NAME = "migrations_history"
    PORT                           = 80
    COINGECKO_API_KEY              = var.coingecko_api_key
    ETHERSCAN_API_KEY              = var.etherscan_api_key
    ALCHEMY_INGESTION_API_KEY      = var.alchemy_ingestion_api_key
    POLYGONSCAN_API_KEY            = var.polygonscan_api_key
    BSCSCAN_API_KEY                = var.bscscan_api_key
    AWS_S3_BUCKET                  = var.aws_s3_bucket
    AWS_S3_ACCESS_KEY              = var.aws_s3_access_key
    AWS_S3_KEY_SECRET              = var.aws_s3_key_secret
    AWS_S3_REGION                  = var.aws_s3_region
    S3_URL                         = var.s3_url
    VAULT_URL                      = var.vault_url
    VAULT_VERSION                  = var.vault_version
    VAULT_ROLE_ID                  = var.vault_role_id
    VAULT_SECRET_ID                = var.vault_secret_id
    VAULT_NAMESPACE                = var.vault_namespace
    VAULT_ENV                      = var.vault_env
    AUTH0_AUDIENCE                 = var.auth0_audience
    AUTH0_ISSUER_URL               = var.auth0_issuer_url
    PUBLIC_AWS_S3_BUCKET           = var.public_aws_s3_bucket
    PRIVATE_AWS_S3_BUCKET          = var.private_aws_s3_bucket
  })
}
