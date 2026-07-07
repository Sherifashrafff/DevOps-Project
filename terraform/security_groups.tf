# ── Kubernetes control plane ──────────────────────────────────────────────────

resource "aws_security_group" "control_plane" {
  name        = "${var.project}-k8s-control-plane"
  description = "Kubernetes control plane"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from bastion only"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  ingress {
    description = "Kubernetes API server"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-k8s-control-plane" }
}

# ── Kubernetes worker nodes ───────────────────────────────────────────────────

resource "aws_security_group" "worker" {
  name        = "${var.project}-k8s-worker"
  description = "Kubernetes worker nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from bastion only"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  # NodePort access is granted per-port via aws_security_group_rule in alb.tf
  # (frontend NodePort from ALB SG only - no open NodePort range to the internet)

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-k8s-worker" }
}

# Cross-cluster rules are separate to avoid the circular-dependency that arises
# when two SGs reference each other inside their own ingress blocks.
resource "aws_security_group_rule" "control_plane_from_worker" {
  description              = "All intra-cluster traffic from worker nodes"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.control_plane.id
  source_security_group_id = aws_security_group.worker.id
}

resource "aws_security_group_rule" "worker_from_control_plane" {
  description              = "All intra-cluster traffic from control plane"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.worker.id
  source_security_group_id = aws_security_group.control_plane.id
}
