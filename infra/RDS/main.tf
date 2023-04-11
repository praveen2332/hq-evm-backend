resource "aws_db_subnet_group" "fs-evm-subnet-group" {
  subnet_ids = var.stage_name == "dev" ? [var.public_subnet_1_id, var.public_subnet_2_id, var.database_subnet_1_id, var.database_subnet_2_id] : [var.private_subnet_1_id, var.private_subnet_2_id, var.database_subnet_1_id, var.database_subnet_2_id]
}
resource "aws_db_instance" "fs-evm-database" {
  instance_class         = "db.t3.micro"
  engine                 = "postgres"
  engine_version         = "14.3"
  allocated_storage      = 30
  max_allocated_storage  = 100
  identifier             = join("-", ["fs-evm-database", var.stage_name])
  username               = var.user_name_database
  password               = var.pass_database
  db_subnet_group_name   = aws_db_subnet_group.fs-evm-subnet-group.name
  vpc_security_group_ids = [var.security_group_database_id]
  publicly_accessible    = var.stage_name == "dev" ? true : false
  skip_final_snapshot    = true
  multi_az               = true
  backup_retention_period= 1
  apply_immediately      = true
}

resource "aws_db_instance" "fs-evm-database-read-replica" {
  instance_class         = "db.t3.micro"
  identifier             = join("-", ["fs-evm-database-read-replica", var.stage_name])
  vpc_security_group_ids = [var.security_group_database_id]
  publicly_accessible    = var.stage_name == "dev" ? true : false
  skip_final_snapshot    = true
  replicate_source_db    = aws_db_instance.fs-evm-database.id

  depends_on = [aws_db_instance.fs-evm-database]
}
