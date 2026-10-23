#!/bin/sh
# Runs the app's cron endpoints on the same schedule as vercel.json (times are UTC).
set -eu

: "${CRON_SECRET:?CRON_SECRET must be set}"
APP_URL="${APP_URL:-http://app:3000}"

# busybox crond doesn't pass the environment to jobs, so write the values into the crontab.
# Job output goes to the container log (PID 1's stdout).
call() {
  echo "wget -q -T 900 -O - --header 'Authorization: Bearer ${CRON_SECRET}' '${APP_URL}/api/cron/$1' > /proc/1/fd/1 2>&1"
}

cat > /etc/crontabs/root <<EOF
# Thursday 19:05: Amazon Prime Gaming and Epic Games
5 19 * * 4 $(call thursday)
# Daily at midnight: Reddit giveaways, Humble Choice and PS Plus
0 0 * * * $(call daily)
EOF

echo "Scheduler started; calling ${APP_URL}/api/cron/{thursday,daily}"
exec crond -f -l 8
