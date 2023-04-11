resource "aws_service_discovery_private_dns_namespace" "backend" {
  name        = join("", ["backend-", var.stage_name, ".local"])
  vpc         = var.vpc_id
  description = "Cloud Map Backend"
}

resource "aws_service_discovery_service" "backend" {
  name = "backend"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.backend.id
    dns_records {
      ttl  = 60
      type = "SRV"
    }
    routing_policy = "MULTIVALUE"
  }
  force_destroy = true
  health_check_custom_config {
    failure_threshold = 1
  }
}
