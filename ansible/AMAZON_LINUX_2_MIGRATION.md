# Amazon Linux 2 Migration Guide

## Overview
This project has been updated to work with **Amazon Linux 2 (amzn2-ami-hvm)** EC2 instances instead of Ubuntu. This document outlines the changes made and important considerations.

## Key Changes Made

### 1. **Package Manager & Names** ✅
- **From:** Ubuntu (apt-get)
- **To:** Amazon Linux 2 (yum)
- **Status:** Already using yum in original code
- **Important Change:** `iproute-tc` → `iproute` (amzn2 package name)

### 2. **Prerequisites Role** ✅
**File:** `prerequisites/tasks/main.yml`

#### Changes:
```yaml
# OLD (Ubuntu)
- iproute-tc

# NEW (Amazon Linux 2)
- iproute
```

#### SELinux Handling:
- **Before:** Unconditional SELinux configuration
- **After:** Conditional check to handle amzn2 where SELinux might not be configured

### 3. **System User**
- **Control Node User:** `ec2-user` (correct for amzn2) ✅
- **No changes needed**

### 4. **Containerization Stack** ✅
- **containerd:** Works with Docker CE CentOS 7 repository (compatible with amzn2)
- **No changes needed** - Docker CE CentOS 7 repo is compatible with Amazon Linux 2

## Architecture Support

### Kubernetes Setup ✅
- **Control Plane:** Single master node
- **Worker Nodes:** One or more worker nodes
- **Container Runtime:** containerd
- **CNI Plugin:** Calico

### Fully Compatible ✅
- systemd (both Ubuntu and amzn2 use systemd)
- Kubernetes components (kubeadm, kubelet, kubectl)
- Network modules (overlay, br_netfilter)
- sysctl parameters
- Kernel module loading

## Pre-Deployment Checklist

### 1. **Inventory Configuration**
Ensure `inv` file matches your instances:
```ini
[control_node]
<MASTER_PRIVATE_IP>

[worker_nodes]
<WORKER_PRIVATE_IP>

[all:vars]
ansible_user=ec2-user
ansible_ssh_private_key_file=~/.ssh/<YOUR_KEY>.pem
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o ProxyJump=ec2-user@<BASTION_IP>'
```

### 2. **EC2 Instance Requirements**
- **AMI:** amzn2-ami-hvm-2.0.20260622.1-x86_64-gp2 (or similar amzn2)
- **Instance Type:** t3.medium or larger (recommended t3.large for master)
- **Security Groups:**
  - Inbound: SSH (22), Kubernetes API (6443), Services (30000-32767)
  - Outbound: All traffic (for package downloads)
- **IAM Role:** EC2 full access (or limited Kubernetes permissions)

### 3. **Network Configuration**
- Master and worker nodes must be in same VPC/security group
- Pod CIDR: 192.168.0.0/16 (configured in controlplane role)
- Ensure DNS resolution works

### 4. **SSH Keys**
- Key pair must be accessible at `~/.ssh/<keyname>.pem`
- Correct permissions (chmod 600)

## Running the Playbook

```bash
# 1. Navigate to ansible directory
cd /home/yusif/projects/End-to-End-DevOps-Project/ansible

# 2. Update inventory with your IP addresses
vim inv

# 3. Run the playbook
ansible-playbook -i inv site.yml -v

# OR for a specific group
ansible-playbook -i inv site.yml -v --limit control_node
ansible-playbook -i inv site.yml -v --limit worker_nodes
```

## Troubleshooting Amazon Linux 2 Specific Issues

### Issue 1: Package Not Found Errors
```
ERROR! iproute-tc not found
```
**Solution:** Already fixed in updated `prerequisites/tasks/main.yml`
- Uses `iproute` instead of `iproute-tc`

### Issue 2: SELinux Configuration Fails
```
Error setting SELinux mode
```
**Solution:** Already handled with conditional check
- Script checks if `/etc/selinux/config` exists before modifying

### Issue 3: Docker CE Repository Access
```
No matching package found for 'containerd.io'
```
**Solution:** 
- Docker CE CentOS 7 repository is configured and compatible
- Verify internet connectivity on instances
- Check security group outbound rules

### Issue 4: EC2-User Sudo Permission
```
Sorry, user ec2-user is not allowed to run sudo
```
**Solution:** Ensure EC2 instance is launched with proper AMI
- Only official AWS amzn2 AMI has pre-configured ec2-user sudo access

## Verification After Deployment

```bash
# 1. SSH into master node
ssh -i ~/.ssh/<key>.pem ec2-user@<master-ip>

# 2. Check cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# 3. Verify Calico is running
kubectl get pods -n kube-system | grep calico

# 4. Check containerd
systemctl status containerd
```

## Known Limitations

1. **SELinux:** Set to permissive mode (not enforced) for Kubernetes compatibility
2. **Swap:** Disabled cluster-wide (Kubernetes requirement)
3. **Firewall:** Security groups handle network access (UFW not used on amzn2)

## Differences from Ubuntu Deployment

| Aspect | Ubuntu | Amazon Linux 2 |
|--------|--------|-----------------|
| Package Manager | apt-get | yum |
| System User | ubuntu/root | ec2-user |
| Firewall | UFW | Security Groups |
| Init System | systemd | systemd |
| SELinux | Not typical | Pre-installed |
| Network Modules | Same | Same |
| Kubernetes Support | Full | Full |

## Additional Notes

- **No code changes to Kubernetes roles** were necessary - the setup is fully compatible
- All network and kernel configurations work identically on amzn2
- containerd with Docker CE CentOS 7 repo is the recommended approach for amzn2
- The project is now cloud-native and follows AWS best practices

## Support & Further Customization

If you need to add additional components or make other changes:
1. Check amzn2 package names (often similar to CentOS/RHEL)
2. Use `yum search <package>` to find availability
3. Refer to AWS documentation for amzn2 specific configurations

---
**Last Updated:** June 2026
**Tested On:** amzn2-ami-hvm-2.0.20260622.1-x86_64-gp2
