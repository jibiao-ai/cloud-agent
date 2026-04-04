#!/bin/bash
# Development startup script
# Starts MySQL and RabbitMQ via Docker, then runs backend and frontend locally

set -e

echo "=== Cloud Agent - Development Mode ==="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "Please edit .env to configure EasyStack and AI API settings"
fi

# Start infrastructure
echo "Starting MySQL and RabbitMQ..."
docker-compose up -d mysql rabbitmq

echo "Waiting for services to be ready..."
sleep 10

# Start backend
echo "Starting backend..."
cd backend
go run cmd/server/main.go &
BACKEND_PID=$!
cd ..

# Start frontend dev server
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== Services Started ==="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8080"
echo "RabbitMQ: http://localhost:15672"
echo ""
echo "Default login: admin / admin123"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose stop mysql rabbitmq; exit" INT TERM
wait
