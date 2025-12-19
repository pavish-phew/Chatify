#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm install
npx vite build
cd ..

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Build complete!"
