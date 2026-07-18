---
name: ds-task
description: Start or continue one bounded DevSpecs task from the user's goal.
---

# DevSpecs ds-task

Use this adapter when the user wants to start or continue a DevSpecs task.

1. Treat the user's requested goal as the bounded work goal.
2. Prefer `ds task "<bounded-goal>"` for known work. Add `--quick` only for a tiny one-off.
3. If a task or slice already exists, run `ds apply`, `ds apply <task-id>`, or `ds apply <target>` instead of creating a duplicate task.
4. If the target is unclear, run `ds recent` and `ds find "<topic>"` as diagnostics, then return to one bounded task.
5. Work exactly one slice at a time. Do not implement an entire track when the current target is a slice like A01.
6. End with a DevSpecs decision gate: `promote`, `improve`, `rework`, `rollback`, or `block`.
7. Record evidence with `ds task checkpoint <task-id|target> --stage validated --decision <gate>` before claiming the slice is done.

Keep `M00` or `A00` as the index, `M01`/`A01` as planned slices, and `M01-1`/`A01-1` as follow-up slices. Create follow-up slices with `ds task slice add <task-id> "<title>" --after A01 --reason improve`.
