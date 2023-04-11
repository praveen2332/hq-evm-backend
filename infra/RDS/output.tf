output "database_endpoint" {
  value = aws_db_instance.fs-evm-database.endpoint
}

output "database_username" {
  value = aws_db_instance.fs-evm-database.username
}

output "database_password" {
  value = aws_db_instance.fs-evm-database.password
}