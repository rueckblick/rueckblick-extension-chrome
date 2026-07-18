---
name: ds-apply
description: Apply exactly one DevSpecs task slice or the next available slice with decision gates.
---

# DevSpecs ds-apply

Use this adapter when the user asks to apply the next DevSpecs slice or a specific task target.

1. Resolve the user's slash-command arguments. If no target is provided, let `ds apply` choose the unambiguous next slice.
2. Run `ds apply` or `ds apply <target>`, then follow the emitted DevSpecs prompt exactly.
3. If the target is unclear, run `ds recent` and `ds find "<topic>"` as diagnostics, then rerun `ds apply` with one target.
4. Implement only the resolved slice. Do not continue into sibling slices unless the decision gate explicitly promotes to them.
5. Record what changed, files read/edited, tests run, misses, noise, and the next gate using `ds task checkpoint`.
6. Stop after the decision gate. Recommend `promote`, `improve`, `rework`, `rollback`, or `block`.

The adapter is a thin wrapper over the DevSpecs CLI. Do not invent a separate task system.
