#!/usr/bin/env bash
# lap.sh: writes one timestamp for the A4 time experiment into a04/output/laps.csv.
#
# Usage (from the repository root):
#   bash a04/tools/lap.sh manual start    # you open the first pack file
#   bash a04/tools/lap.sh manual stop     # every checklist item is ticked
#   bash a04/tools/lap.sh ai start        # you send the request to OpenCode
#   bash a04/tools/lap.sh ai verify       # the report file is written; checking starts
#   bash a04/tools/lap.sh ai stop         # every checklist item is ticked
#
# Each call adds one row (timestamp_iso,epoch_s,condition,event). Existing rows
# are never changed. On "stop" the script prints the minutes since the last
# "start" of the same condition (for ai also drafting and checking minutes).
# Times are in UTC. No other programs needed besides bash, date and awk.

set -u

usage() {
  echo "Usage: bash a04/tools/lap.sh <condition> <event>"
  echo
  echo "  condition:  manual   (writing the report by hand)"
  echo "              ai       (OpenCode writes the report, you check it)"
  echo "  event:      start    (the clock starts)"
  echo "              verify   (ai only: the report file is written, you start checking)"
  echo "              stop     (every item of a04/send_ready_checklist.md is ticked)"
  echo
  echo "Example:  bash a04/tools/lap.sh ai start"
  exit 2
}

[ $# -eq 2 ] || usage
condition="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
event="$(printf '%s' "$2" | tr '[:upper:]' '[:lower:]')"

case "$condition" in
  manual|ai) ;;
  *) echo "Unknown condition: $1 (use manual or ai)"; echo; usage ;;
esac
case "$event" in
  start|verify|stop) ;;
  *) echo "Unknown event: $2 (use start, verify or stop)"; echo; usage ;;
esac
if [ "$condition" = "manual" ] && [ "$event" = "verify" ]; then
  echo "verify is only for the ai condition: in the manual condition, writing and checking are one block."
  echo "Nothing was written. Use: bash a04/tools/lap.sh manual stop   when the checklist is ticked."
  exit 2
fi

# Find a04/output/ next to this script's folder, wherever the script is called from.
script_dir="$(cd "$(dirname "$0")" && pwd)" || { echo "Cannot find the folder of lap.sh."; exit 1; }
out_dir="$(dirname "$script_dir")/output"
csv="$out_dir/laps.csv"
header="timestamp_iso,epoch_s,condition,event"

mkdir -p "$out_dir" || { echo "Cannot create $out_dir"; exit 1; }
if [ ! -s "$csv" ]; then
  echo "$header" >"$csv" || { echo "Cannot write $csv"; exit 1; }
elif [ -n "$(tail -c 1 "$csv")" ]; then
  echo >>"$csv"   # the file was edited and lost its final line break: add one before appending
fi

epoch="$(date +%s)"
iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Read earlier rows BEFORE appending: last start of this condition, and for ai the
# last verify after that start. Rows that are not "number,condition,event" are ignored.
read -r last_start last_verify <<EOF
$(awk -F, -v c="$condition" '
  $2 ~ /^[0-9]+$/ && $3 == c && $4 == "start"  { s = $2; v = "" }
  $2 ~ /^[0-9]+$/ && $3 == c && $4 == "verify" { if (s != "") v = $2 }
  END { if (s == "") s = "-"; if (v == "") v = "-"; print s, v }
' "$csv")
EOF

echo "$iso,$epoch,$condition,$event" >>"$csv" || { echo "Cannot write $csv"; exit 1; }
echo "Logged: $condition $event at $iso (UTC) in a04/output/laps.csv"

minutes() {  # minutes <from_epoch> <to_epoch> -> one decimal
  awk -v a="$1" -v b="$2" 'BEGIN { printf "%.1f", (b - a) / 60 }'
}

case "$event" in
  start)
    if [ "$last_start" != "-" ]; then
      echo "Note: there is already a start for $condition. The next stop counts from this new start."
    fi
    ;;
  verify)
    if [ "$last_start" = "-" ]; then
      echo "Warning: no 'ai start' found before this verify. Write the start time you remember into"
      echo "a04/experiment_log.md and mark it as an estimate."
    else
      echo "Drafting took $(minutes "$last_start" "$epoch") min. Now check the report against the source files."
    fi
    ;;
  stop)
    if [ "$last_start" = "-" ]; then
      echo "Warning: no '$condition start' found, so the minutes cannot be computed."
      echo "Write the start time you remember into a04/experiment_log.md and mark it as an estimate."
      exit 0
    fi
    total="$(minutes "$last_start" "$epoch")"
    echo "Total for $condition: $total min (from the last $condition start)."
    if [ "$condition" = "ai" ]; then
      if [ "$last_verify" = "-" ]; then
        echo "No 'ai verify' after the last start: drafting and checking cannot be split."
        echo "Write your best estimate of the split into a04/experiment_log.md and mark it as an estimate."
      else
        echo "  Drafting (start to verify): $(minutes "$last_start" "$last_verify") min"
        echo "  Checking (verify to stop):  $(minutes "$last_verify" "$epoch") min"
      fi
    fi
    if [ $((epoch - last_start)) -gt 900 ]; then
      echo "This is over the 15-minute cap: log the run as 15+ in a04/experiment_log.md,"
      echo "with the share of sections that were done at minute 15."
    fi
    ;;
esac
exit 0
