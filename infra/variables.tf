variable "aws_access_key" {
  description = "AWS Access Key"
  type        = string
}

variable "aws_secret_key" {
  description = "AWS Secret Key"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  default     = "ap-southeast-1"
  type        = string
}

variable "stage_name" {
  description = "Stage run"
  type        = string
}

variable "password_database" {
  description = "Password of Database"
  type        = string
}

variable "image_backend" {
  description = "Image of backend"
  type        = string
}

variable "user_name_database" {
  description = "User Name of Database"
  type        = string
}

variable "name_database" {
  description = "Name of Database"
  type        = string
}

variable "coingecko_api_key" {
  description = "Coingecko API Key"
  type        = string
}

variable "etherscan_api_key" {
  description = "Etherscan API Key"
  type        = string
}

variable "alchemy_ingestion_api_key" {
  description = "Alchemy API Key for Ingestion"
  type        = string
}

variable "polygonscan_api_key" {
  description = "Polygon API Key"
  type        = string
}

variable "bscscan_api_key" {
  description = "BSC API Key"
  type        = string
}

variable "aws_s3_bucket" {
  description = "AWS S3 Bucket"
  type        = string
}

variable "aws_s3_access_key" {
  description = "AWS S3 Access Key"
  type        = string
}

variable "aws_s3_key_secret" {
  description = "AWS S3 Key Secret"
  type        = string
}

variable "aws_s3_region" {
  description = "AWS S3 Region"
  type        = string
}

variable "s3_url" {
  description = "S3 Url"
  type        = string
}

variable "vault_url" {
  description = "Vault Url"
  type        = string
}

variable "vault_version" {
  description = "Vault version"
  type        = string
}

variable "vault_role_id" {
  description = "Vault role id"
  type        = string
}

variable "vault_secret_id" {
  description = "Vault secret id"
  type        = string
}

variable "vault_namespace" {
  description = "Vault namespace"
  type        = string
}

variable "vault_env" {
  description = "Vault env"
  type        = string
}

variable "auth0_audience" {
  description = "AUTH0 Audience for verification JWT"
  type        = string
}
variable "auth0_issuer_url" {
  description = "AUTH0 Issuer URL for verification JWT"
  type        = string
}

variable "public_aws_s3_bucket" {
  description = "Public AWS S3 Bucket"
  type        = string
}

variable "private_aws_s3_bucket" {
  description = "Private AWS S3 Bucket"
  type        = string
}
