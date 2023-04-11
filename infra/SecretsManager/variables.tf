variable "user_name_database" {
  description = "User Name of Database"
}

variable "password_database" {
  description = "Password of Database"
}

variable "endpoint_database" {
  description = "Endpoint of Database"
}

variable "port_database" {
  description = "Port of Database"
  default     = 5432
}

variable "name_database" {
  description = "Name of Database"
}

variable "stage_name" {
  description = "Stage Name"
}

variable "coingecko_api_key" {
  description = "Coingecko API Key"
}

variable "etherscan_api_key" {
  description = "Etherscan API Key"
}

variable "alchemy_ingestion_api_key" {
  description = "Alchemy API Key for Ingestion"
}

variable "polygonscan_api_key" {
  description = "Polygon API Key"
}

variable "bscscan_api_key" {
  description = "BSC API Key"
}

variable "aws_s3_bucket" {
  description = "AWS S3 Bucket"
}

variable "aws_s3_access_key" {
  description = "AWS S3 Access Key"
}

variable "aws_s3_key_secret" {
  description = "AWS S3 Key Secret"
}

variable "aws_s3_region" {
  description = "AWS S3 Region"
}

variable "s3_url" {
  description = "S3 Url"
}

variable "vault_url" {
  description = "Vault Url"
}

variable "vault_version" {
  description = "Vault version"
}

variable "vault_role_id" {
  description = "Vault role id"
}

variable "vault_secret_id" {
  description = "Vault secret id"
}

variable "vault_namespace" {
  description = "Vault namespace"
}

variable "vault_env" {
  description = "Vault env"
}

variable "auth0_audience" {
  description = "AUTH0 Audience for verification JWT"
}

variable "auth0_issuer_url" {
  description = "AUTH0 Issuer URL for verification JWT"
}

variable "public_aws_s3_bucket" {
  description = "Public AWS S3 Bucket"
}

variable "private_aws_s3_bucket" {
  description = "Private AWS S3 Bucket"
}
