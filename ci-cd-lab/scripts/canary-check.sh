#!/usr/bin/env bash
# Sends N requests through the gateway, prints version split, fails if any request errors.
N=${1:-50}; URL=${2:-http://localhost:8080/api/info}; ERR=0
declare -A C
for _ in $(seq "$N"); do
  R=$(curl -s -f "$URL") || { ERR=$((ERR+1)); continue; }
  V=$(echo "$R" | sed -E 's/.*"version":"([^"]+)".*/\1/'); C[$V]=$(( ${C[$V]:-0} + 1 ))
done
for V in "${!C[@]}"; do echo "version $V: ${C[$V]} / $N"; done
echo "errors: $ERR"; [ "$ERR" -eq 0 ]
