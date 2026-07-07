# RDS requires a subnet group spanning at least 2 AZs
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-rds-subnets"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${var.project}-rds-subnets" }
}

# ── PostgreSQL moved in-cluster (Kubernetes StatefulSet — see ../k8s/) ─────────
# The managed RDS PostgreSQL ("Aurora") instance is no longer provisioned by
# Terraform. This `removed` block drops it from Terraform state on the next
# `apply` WITHOUT destroying it — `lifecycle { destroy = false }` leaves the
# instance running in AWS so it can be decommissioned manually.
#
# After you run `terraform apply` once (which removes it from state) and have
# manually deleted the instance in AWS, this block can be deleted too.
removed {
  from = aws_db_instance.postgres

  lifecycle {
    destroy = false
  }
}
