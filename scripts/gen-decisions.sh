#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
{ printf '# Decision Log\n\n> Generated from adr/ — edit the per-decision files, not this one.\n'
  for f in adr/D-*.md; do printf '\n'; sed 's/^# /## /' "$f"; done
} > DECISIONS.md
