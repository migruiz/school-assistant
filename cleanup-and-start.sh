#!/bin/sh
# Move to app root
cd "$(dirname "$0")"

# If node_modules.tar.gz exists, remove it
if [ -f "node_modules.tar.gz" ]; then
  echo "Deleting node_modules.tar.gz to save space..."
  rm -f node_modules.tar.gz
fi

# Start Next.js
./node_modules/next/dist/bin/next start -p $PORT
