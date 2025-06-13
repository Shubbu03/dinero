FROM golang:1.24.3 AS builder

ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o dinero-backend ./cmd/main.go

FROM debian:bullseye-slim

RUN useradd -m appuser

WORKDIR /app

COPY --from=builder /app/dinero-backend .

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["./dinero-backend"]
