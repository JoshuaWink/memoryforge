# .kb/rules.md — Ecological Laws of the Knowledge Base

## Succession Stages

| Stage | Name | Population | Rules Active |
|-------|------|-----------|--------------|
| 0 | Pioneer | N < 5 | No rules enforced |
| 1 | Grassland | 5 ≤ N < 12 | Frontmatter required |
| 2 | Shrubland | 12 ≤ N < 30 | Health checks, drift detection |
| 3 | Forest | 30 ≤ N < 80 | Category promotion (√N rule) |
| 4 | Old Growth | N ≥ 80 | Adaptive radiation, archive pressure |

## Formulas

### Promotion Threshold
```
PROMOTE(t) ⟺ C_t ≥ max(5, ⌈√N⌉)
```

### Carrying Capacity
```
K_root = 12, K_category = 15, K_subcategory = 10
pressure = (count - K) / K
```

### Tag Merge (Jaccard)
```
MERGE(a, b) ⟺ J(a,b) = |a ∩ b| / |a ∪ b| ≥ 0.7
```

### Entropy (Health)
```
H = -Σ d_t × log₂(d_t)
```

### Drift Detection
```
DRIFT(a, b) ⟺ |a ∩ b| = 0 ∧ neighbor_overlap(a, b) ≥ 0.4
```

## Max Depth
```
D_max = 3
```
