# TaskFlow Kubernetes manifests

PostgreSQL runs **in-cluster as a StatefulSet**. The database is not provisioned by
Terraform — it is defined entirely by the manifests in this directory.

## Manifests

| File | Purpose |
|------|---------|
| `00-namespace.yaml`    | `taskflow` namespace |
| `05-storageclass.yaml` | `local-path` StorageClass (default) backing the Postgres PVC |
| `10-secrets.yaml`      | DB credentials + `JWT_SECRET` (**edit before applying**) |
| `20-postgres.yaml`     | Postgres headless Service + StatefulSet (`volumeClaimTemplates`, 5Gi PVC) |
| `30-backend.yaml`      | Backend ConfigMap + Service + Deployment (migrations run in an initContainer) |
| `40-frontend.yaml`     | Frontend Deployment + NodePort Service on `30080` (ALB target) |

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

## Storage

The Postgres PVC uses the `local-path` StorageClass in `05-storageclass.yaml`
(provisioner `rancher.io/local-path`), which stores data on the worker node's local disk.

That StorageClass only works if the **local-path-provisioner controller** is running in
the cluster. Install it once (it is not part of a bare kubeadm cluster):

```bash
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.30/deploy/local-path-storage.yaml
```

The upstream bundle also ships its own `local-path` StorageClass; ours here just marks it
the cluster default. Verify with:

```bash
kubectl get storageclass          # local-path should be listed as (default)
kubectl -n taskflow get pvc       # data-postgres-0 should be Bound, not Pending
```

Note: `local-path` is node-local — the DB data lives on whichever node the pod runs on and
is lost if that node is destroyed. Use a networked provisioner (e.g. EBS CSI) for durability.
