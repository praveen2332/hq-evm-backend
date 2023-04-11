resource "aws_apigatewayv2_api" "backend" {
  name          = join("-", ["backend", var.stage_name])
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_vpc_link" "backend" {
  name               = join("-", ["backend", var.stage_name])
  security_group_ids = [var.security_group_vpc_link_backend_id]
  subnet_ids         = var.stage_name == "dev" ? [var.subnet_public_1_id, var.subnet_public_2_id] : [var.subnet_private_1_id, var.subnet_private_2_id]
}

resource "aws_apigatewayv2_integration" "backend" {
  api_id             = aws_apigatewayv2_api.backend.id
  integration_type   = "HTTP_PROXY"
  description        = "Integration with cloudmap"
  integration_uri    = var.cloudmap_backend_arn
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.backend.id
}

resource "aws_apigatewayv2_route" "backend" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "ANY /{proxy+}"
  target    = join("/", ["integrations", aws_apigatewayv2_integration.backend.id])
}

resource "aws_apigatewayv2_stage" "backend" {
  api_id      = aws_apigatewayv2_api.backend.id
  name        = "$default"
  auto_deploy = true
}