---
name: push-verify
description: Gate 5 — verify every push succeeded and repo is clean
type: feedback
---

After every push:

- [ ] Confirm push succeeded: `git log origin/main --oneline -3`
- [ ] Working tree is clean: `git status`
- [ ] Version strings consistent (pom.xml `<version>`, package.json `"version"`)
- [ ] No broken CI (check GitHub Actions if configured — currently no CI pipeline)

**Why:** A push that silently fails leaves the remote diverged. Version drift across manifests causes confusion.

**How to apply:** Gate 5 runs immediately after every `git push`.
