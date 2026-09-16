#!/usr/bin/env bash
# Rebuilds the React frontend and copies the production bundle into
# backend/public, so `npm start` in backend/ serves the whole app
# (frontend + API) from one server on one port.
set -e
cd "$(dirname "$0")/frontend"
npm install
npm run build
rm -rf ../backend/public
cp -r dist ../backend/public
echo "Frontend built and copied to backend/public. Run the backend to serve it."
