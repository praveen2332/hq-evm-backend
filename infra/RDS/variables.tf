variable "user_name_database" {
  description = "User Name of Database"
}

variable "pass_database" {
  description = "Password Database RDS"
}

variable "public_subnet_1_id" {
  description = "Subnet Public 1"
  type        = string
}
variable "public_subnet_2_id" {
  description = "Subnet Public 2"
  type        = string
}

variable "private_subnet_1_id" {
  default = "Subnet Private 1"
  type    = string
}

variable "private_subnet_2_id" {
  default = "Subnet Private 2"
  type    = string
}

variable "database_subnet_1_id" {
  description = "Subnet Database 1"
  type        = string
}
variable "database_subnet_2_id" {
  description = "Subnet Database 2"
  type        = string
}

variable "security_group_database_id" {
  description = "Security Group database"
}

variable "stage_name" {
  description = "Stage Name"
}