# Build stage
FROM golang:1.22-alpine AS builder

# Install build dependencies (git is required for go mod download)
RUN apk add --no-cache gcc musl-dev git

WORKDIR /app

# Set Go module proxy for reliable downloads
# Uses Google proxy with direct fallback; switch to goproxy.cn if in China mainland
ENV GOPROXY=https://goproxy.io,https://proxy.golang.org,direct
ENV GONOSUMCHECK=*
ENV GOFLAGS=-mod=mod

# Copy dependency files first for better layer caching
COPY go.mod go.sum ./

# Download dependencies with retry logic
RUN go mod download || go mod download || go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# ========================
# Runtime stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
