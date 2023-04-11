locals {
  cidr_block_dot = var.stage_name == "prod" ? 2 : (var.stage_name == "dev" ? 0 : 1)
}

resource "aws_vpc" "fs-evm" {
  cidr_block           = join(".", ["10", local.cidr_block_dot, "0.0/20"])
  instance_tenancy     = "default"
  enable_dns_hostnames = true
  tags = {
    Name = join("-", ["fs-evm", var.stage_name])
  }
}

resource "aws_subnet" "fs-evm-public-1" {
  vpc_id            = aws_vpc.fs-evm.id
  cidr_block        = join(".", ["10", local.cidr_block_dot, "0.0/24"])
  availability_zone = "ap-southeast-1a"
  tags = {
    Name = join("-", ["fs-evm", var.stage_name, "public-1"])
  }
}

resource "aws_subnet" "fs-evm-public-2" {
  vpc_id            = aws_vpc.fs-evm.id
  cidr_block        = join(".", ["10", local.cidr_block_dot, "1.0/24"])
  availability_zone = "ap-southeast-1b"
  tags = {
    Name = join("-", ["fs-evm", var.stage_name, "public-2"])
  }
}

resource "aws_subnet" "fs-evm-private-1" {
  vpc_id            = aws_vpc.fs-evm.id
  cidr_block        = join(".", ["10", local.cidr_block_dot, "2.0/24"])
  availability_zone = "ap-southeast-1a"
  tags = {
    Name = join("-", ["fs-evm", var.stage_name, "private-1"])
  }
}

resource "aws_subnet" "fs-evm-private-2" {
  vpc_id            = aws_vpc.fs-evm.id
  cidr_block        = join(".", ["10", local.cidr_block_dot, "3.0/24"])
  availability_zone = "ap-southeast-1b"
  tags = {
    Name = join("-", ["fs-evm", var.stage_name, "private-2"])
  }
}

resource "aws_subnet" "fs-evm-database-1" {
  vpc_id            = aws_vpc.fs-evm.id
  cidr_block        = join(".", ["10", local.cidr_block_dot, "4.0/24"])
  availability_zone = "ap-southeast-1a"
  tags = {
    Name = join("-", ["fs-evm", var.stage_name, "database-1"])
  }
}

resource "aws_subnet" "fs-evm-database-2" {
  vpc_id            = aws_vpc.fs-evm.id
  cidr_block        = join(".", ["10", local.cidr_block_dot, "5.0/24"])
  availability_zone = "ap-southeast-1b"
  tags = {
    Name = join("-", ["fs-evm", var.stage_name, "database-2"])
  }
}

resource "aws_internet_gateway" "fs-evm-ig" {
  vpc_id = aws_vpc.fs-evm.id
  tags = {
    Name = join("-", ["fs-evm", "ig", var.stage_name])
  }
}

resource "aws_eip" "fs-evm-eip" {
  count = var.stage_name == "dev" ? 0 : 1
  vpc   = true
  tags = {
    Name = join("-", ["fs-evm", "eip", var.stage_name])
  }
}

resource "aws_nat_gateway" "fs-evm-nat" {
  count         = var.stage_name == "dev" ? 0 : 1
  subnet_id     = aws_subnet.fs-evm-public-1.id
  allocation_id = aws_eip.fs-evm-eip[count.index].id
  tags = {
    Name = join("-", ["fs-evm", "nat", var.stage_name])
  }
}

resource "aws_route_table" "fs-evm-rt-public" {
  vpc_id = aws_vpc.fs-evm.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.fs-evm-ig.id
  }
  tags = {
    Name = join("-", ["fs-evm", "rt-public", var.stage_name])
  }
}

resource "aws_route_table" "fs-evm-rt-private" {
  count  = var.stage_name == "dev" ? 0 : 1
  vpc_id = aws_vpc.fs-evm.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.fs-evm-nat[count.index].id
  }
  tags = {
    Name = join("-", ["fs-evm", "rt-private", var.stage_name])
  }
}

resource "aws_route_table_association" "association-public-1" {
  route_table_id = aws_route_table.fs-evm-rt-public.id
  subnet_id      = aws_subnet.fs-evm-public-1.id
}

resource "aws_route_table_association" "association-public-2" {
  route_table_id = aws_route_table.fs-evm-rt-public.id
  subnet_id      = aws_subnet.fs-evm-public-2.id
}

resource "aws_route_table_association" "association-database-public-1" {
  count          = var.stage_name == "dev" ? 1 : 0
  route_table_id = aws_route_table.fs-evm-rt-public.id
  subnet_id      = aws_subnet.fs-evm-database-1.id
}

resource "aws_route_table_association" "association-database-public-2" {
  count          = var.stage_name == "dev" ? 1 : 0
  route_table_id = aws_route_table.fs-evm-rt-public.id
  subnet_id      = aws_subnet.fs-evm-database-2.id
}

resource "aws_route_table_association" "association-database-private-1" {
  count          = var.stage_name == "dev" ? 0 : 1
  route_table_id = aws_route_table.fs-evm-rt-private[count.index].id
  subnet_id      = aws_subnet.fs-evm-database-1.id
}

resource "aws_route_table_association" "association-database-private-2" {
  count          = var.stage_name == "dev" ? 0 : 1
  route_table_id = aws_route_table.fs-evm-rt-private[count.index].id
  subnet_id      = aws_subnet.fs-evm-database-2.id
}

resource "aws_route_table_association" "association-private-1" {
  count          = var.stage_name == "dev" ? 0 : 1
  subnet_id      = aws_subnet.fs-evm-private-1.id
  route_table_id = aws_route_table.fs-evm-rt-private[count.index].id
}

resource "aws_route_table_association" "association-private-2" {
  count          = var.stage_name == "dev" ? 0 : 1
  subnet_id      = aws_subnet.fs-evm-private-2.id
  route_table_id = aws_route_table.fs-evm-rt-private[count.index].id
}

resource "aws_security_group" "database_sg" {
  name        = join("-", ["fs-evm", "database", var.stage_name])
  description = "Security Group database"
  vpc_id      = aws_vpc.fs-evm.id
  ingress {
    from_port        = 5432
    protocol         = "TCP"
    to_port          = 5432
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  egress {
    from_port        = 0
    protocol         = "-1"
    to_port          = 0
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "ecs_backend_sg" {
  name        = join("-", ["fs-evm", "ecs-backend", var.stage_name])
  description = "Security Group ECS Backend"
  vpc_id      = aws_vpc.fs-evm.id
  ingress {
    from_port        = 80
    protocol         = "TCP"
    to_port          = 80
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  egress {
    from_port        = 0
    protocol         = "-1"
    to_port          = 0
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "vpc_link_backend" {
  name        = join("-", ["fs-evm", "vpc-link-backend", var.stage_name])
  description = "Security Group VPC Link Backend"
  vpc_id      = aws_vpc.fs-evm.id
  ingress {
    from_port        = 80
    protocol         = "TCP"
    to_port          = 80
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  egress {
    from_port        = 0
    protocol         = "-1"
    to_port          = 0
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}