output "security_group_database_id" {
  value = aws_security_group.database_sg.id
}

output "subnet_public_1_id" {
  value = aws_subnet.fs-evm-public-1.id
}

output "subnet_public_2_id" {
  value = aws_subnet.fs-evm-public-2.id
}

output "subnet_database_1_id" {
  value = aws_subnet.fs-evm-database-1.id
}

output "subnet_database_2_id" {
  value = aws_subnet.fs-evm-database-2.id
}

output "subnet_private_1_id" {
  value = aws_subnet.fs-evm-private-1.id
}

output "subnet_private_2_id" {
  value = aws_subnet.fs-evm-private-2.id
}

output "security_group_ecs_backend_id" {
  value = aws_security_group.ecs_backend_sg.id
}

output "vpc_id" {
  value = aws_vpc.fs-evm.id
}

output "security_group_vpc_link_backend_id" {
  value = aws_security_group.vpc_link_backend.id
}