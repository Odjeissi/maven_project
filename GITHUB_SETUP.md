# GitHub presentation checklist

**Suggested repository title:** `java-ecommerce-devsecops` (optional rename; preserve old links with GitHub redirect, then verify).

**GitHub About description (copy/paste):**

Java e-commerce DevSecOps project: Terraform-provisioned AWS, GitLab CI/CD, EKS, Argo CD GitOps, security scans, and Prometheus/Grafana.

**Terraform note:** Mention Terraform as the IaC used for AWS provisioning; do not upload Terraform code or link to its private location.

**Topics:** `terraform`, `devsecops`, `gitlab-ci`, `spring-boot`, `maven`, `java`, `aws-eks`, `kubernetes`, `argocd`, `gitops`, `trivy`, `prometheus`, `grafana`

**Upload instructions:** Place README.md and docs/ at the repository root. They are designed to work alongside your existing `code_source/` and `k8s/` folders. Do **not** upload the source ZIPs or this setup note.

**Suggested GitHub profile pin:** Pin this repository alongside aws-3tier-terraform and ks8, to show an IaC → cloud deployment → DevSecOps/GitOps progression.

**Recommended checks before publicizing:**

1. Ensure the branch-rule changes you pushed are present in the real GitLab project and reflect the README's branch policy.
2. Investigate ZAP high/medium findings; document any accepted risks.
3. Inspect `k8s/eso/ClusterSecretStore.yaml`: a committed `status: Ready False / ValidationFailed` block is undesirable in desired-state YAML. Remove generated status after troubleshooting.
4. Verify the dev deployment, external secrets and ingress in the actual cluster; screenshots represent a point in time.
5. Verify no `.env`, credentials, live secret values, `target/`, or huge local artifacts are tracked. In the uploaded ZIP, `code_source/target/` exists; make sure it is not committed.
6. Optional: add one screenshot of the NEXORA storefront and a short walkthrough GIF/video to show the actual user experience.
7. Optional: publish an architecture decision record or CI testing notes describing branch rules, scan exceptions and rollback approaches.

**Resume project title:** Java E-Commerce DevSecOps Pipeline | AWS EKS, GitLab CI/CD & Argo CD

**Resume bullet examples — adapt to confirmed live behavior:**
- Built a Java 21/Spring Boot e-commerce application delivery pipeline integrating Maven tests, SonarQube, Snyk, Gitleaks, Trivy, container publishing to Amazon ECR, and OWASP ZAP.
- Automated Kubernetes development deployments through GitLab-to-GitHub image-tag updates, Kustomize and Argo CD; configured health probes, ALB Ingress and secrets integration.
- Instrumented application metrics using Spring Actuator/Micrometer and Prometheus; used Grafana to observe pod CPU/memory and verified two healthy scrape targets.

**Architecture note:** The Terraform node represents private IaC provisioning, not a separate publicly inspectable component.
