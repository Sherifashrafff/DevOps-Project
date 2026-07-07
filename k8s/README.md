# TaskFlow Kubernetes manifests

PostgreSQL runs **in-cluster as a StatefulSet**. The database is not provisioned by
Terraform — it is defined entirely by the manifests in this directory.

## Manifests

| File | Purpose |
|------|---------|
| `00-namespace.yaml` | `taskflow` namespace |
| `10-secrets.yaml`   | DB credentials + `JWT_SECRET` (**edit before applying**) |
| `20-postgres.yaml`  | Postgres headless Service + StatefulSet (`volumeClaimTemplates`, 20Gi PVC) |
| `30-backend.yaml`   | Backend ConfigMap + Service + Deployment (migrations run in an initContainer) |
| `40-frontend.yaml`  | Frontend Deployment + NodePort Service on `30080` (ALB target) |

## Apply

```bash
# 1. Edit the placeholder values in 10-secrets.yaml first!
kubectl apply -f k8s/            # applies in filename order (00 → 40)

# Watch the database come up, then the app roll out
kubectl -n taskflow rollout status statefulset/postgres
kubectl -n taskflow rollout status deployment/backend
kubectl -n taskflow rollout status deployment/frontend
```

## How the app reaches the DB

The backend connects using the `DB_*` env vars (see `backend/src/config/env.js`):
`DB_HOST=postgres.taskflow.svc.cluster.local`, `DB_PORT=5432`, with the name/user/password
sourced from the `taskflow-secrets` Secret. No AWS Secrets Manager lookup is involved anymore.

## Storage note

`volumeClaimTemplates` requires a working default StorageClass (dynamic provisioning).
On this self-managed cluster, ensure a provisioner (e.g. EBS CSI driver) and a default
StorageClass exist, otherwise the PVC will stay `Pending`. Check with:

```bash
kubectl get storageclass
```
