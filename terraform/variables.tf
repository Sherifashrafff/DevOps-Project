variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name - used as a prefix for every resource name and tag"
  type        = string
  default     = "taskflow"
}

# ── Network ───────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into the bastion - restrict to your IP in production"
  type        = string
  default     = "0.0.0.0/0"
}

# ── EC2 ───────────────────────────────────────────────────────────────────────

variable "bastion_instance_type" {
  description = "EC2 instance type for the bastion host"
  type        = string
  default     = "t3.micro"
}

variable "jenkins_instance_type" {
  description = "EC2 instance type for the Jenkins server"
  type        = string
  default     = "t3.micro"
}

variable "master_instance_type" {
  description = "EC2 instance type for the Kubernetes control plane"
  type        = string
  default     = "t3.small"
}

variable "worker_instance_type" {
  description = "EC2 instance type for each Kubernetes worker node"
  type        = string
  default     = "t3.micro"
}

variable "worker_count" {
  description = "Number of Kubernetes worker nodes"
  type        = number
  default     = 1
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB for all nodes"
  type        = number
  default     = 20
}

# ── ALB / Ingress ─────────────────────────────────────────────────────────────

variable "frontend_nodeport" {
  description = "Kubernetes NodePort for the frontend service - ALB forwards here"
  type        = number
  default     = 30080
}
