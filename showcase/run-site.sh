#!/usr/bin/env bash
# Usage: run-site.sh <slug> <repoDir> <kind: static|next|vite|astro|pnpm-next> [appSubdir] [brand]
# Installs + starts the site locally, captures screenshots into $SW/sites/<slug>, then stops it.
set -u
SLUG=$1; DIR=$2; KIND=$3; APP=${4:-.}; BRAND=${5:-}
SW=${SW:-/home/user/showcase-work}; HERE=$(cd "$(dirname "$0")" && pwd)
PORT=$((9100 + RANDOM % 800)); LOG=$SW/logs/$SLUG.log; mkdir -p $SW/logs
log(){ echo "[$(date +%T)] $*" | tee -a $LOG; }
cd "$DIR" || { log "no dir"; exit 1; }
for f in .env.example $APP/.env.example; do [ -f $f ] && { cp -n $f $(dirname $f)/.env 2>/dev/null; cp -n $f $(dirname $f)/.env.local 2>/dev/null; }; done
export NEXT_TELEMETRY_DISABLED=1 BROWSER=none
# run dev servers without agent/CI markers so framework CLIs start normally
for v in $(env | grep -oE '^(CLAUDE[A-Z_]*|CI)=' | tr -d '='); do unset $v; done
[ -n "${EXTRA_ENV:-}" ] && export $EXTRA_ENV

case $KIND in
  static) (python3 -m http.server $PORT --bind 127.0.0.1 >>$LOG 2>&1 & echo $! > /tmp/srv.$SLUG) ;;
  next|vite|astro)
    log "npm install"; npm install --no-audit --no-fund --loglevel=error >>$LOG 2>&1 || npm install --legacy-peer-deps --no-audit --no-fund --loglevel=error >>$LOG 2>&1
    cd $APP
    case $KIND in
      next) CMD="npx next dev -p $PORT -H 127.0.0.1" ;;
      vite) CMD="npx vite --port $PORT --host 127.0.0.1 --strictPort" ;;
      astro) CMD="npx astro dev --port $PORT --host 127.0.0.1" ;;
    esac
    (setsid bash -c "$CMD || $CMD" >>$LOG 2>&1 & echo $! > /tmp/srv.$SLUG) ;;
  pnpm-next)
    log "pnpm install"; pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false >>$LOG 2>&1
    [ -n "${PRE:-}" ] && { log "pre: $PRE"; bash -c "$PRE" >>$LOG 2>&1; }
    cd $APP; [ -f .env.example ] && cp -n .env.example .env.local
    (setsid bash -c "npx next dev -p $PORT -H 127.0.0.1 || npx next dev -p $PORT -H 127.0.0.1" >>$LOG 2>&1 & echo $! > /tmp/srv.$SLUG) ;;
esac
URL=http://127.0.0.1:$PORT/
log "waiting for $URL"
ok=0; for i in $(seq 1 120); do c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 $URL); [[ $c =~ ^[23] ]] && { ok=1; break; }; sleep 2; done
if [ $ok = 1 ]; then
  log "up ($c), capturing"
  node $HERE/capture.js $URL $SW/sites/$SLUG "$BRAND" >>$LOG 2>&1 && log "CAPTURED $(tail -1 $LOG)" || log "CAPTURE FAILED"
else log "SERVER FAILED (last code $c)"; fi
PID=$(cat /tmp/srv.$SLUG 2>/dev/null); [ -n "$PID" ] && { kill -- -$PID 2>/dev/null || kill $PID 2>/dev/null; }
pkill -f "port $PORT|-p $PORT|:$PORT" 2>/dev/null
cd "$DIR"; find . -name node_modules -type d -prune -exec rm -rf {} + 2>/dev/null; rm -rf .next */.next apps/*/.next 2>/dev/null
log "done"
