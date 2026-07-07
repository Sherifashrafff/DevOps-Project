resource "aws_iam_role" "ec2_node" {
  name = "${var.project}-ec2-node"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Allows nodes to pull images from any ECR repo in the account
resource "aws_iam_role_policy_attachment" "ecr_readonly" {
  role       = aws_iam_role.ec2_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Allows nodes to call GetAuthorizationToken (required by docker login to ECR)
resource "aws_iam_role_policy_attachment" "ecr_auth" {
  role       = aws_iam_role.ec2_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPullOnly"
}

resource "aws_iam_instance_profile" "ec2_node" {
  name = "${var.project}-ec2-node"
  role = aws_iam_role.ec2_node.name
}

# NOTE: the "read_db_secret" inline policy was removed alongside the RDS
# instance — the database now runs in-cluster (Kubernetes StatefulSet) with
# credentials supplied via a Kubernetes Secret, so pods no longer read the
# RDS master credentials from Secrets Manager.
