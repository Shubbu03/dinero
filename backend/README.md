# Paytm Backend API

A backend implementation for a Paytm-like payment application built with Go.

## Overview

This is a REST API service that provides core payment functionality including user authentication, money transfers, transaction history, and friend management.

## Features

- User authentication (signup/login)
- Money transfers between users
- Transaction history
- Friend management
- Wallet balance tracking

## Tech Stack

- **Language**: Go
- **Web Framework**: Chi Router
- **Database**: PostgreSQL
- **ORM**: GORM
- **Authentication**: JWT tokens

## Setup

1. Install Go and PostgreSQL
2. Create a `.env` file with your database URL and JWT secret
3. Run `go mod tidy` to install dependencies
4. Run `go run cmd/main.go` to start the server

## Environment Variables

```env
DB_URL=postgres://username:password@localhost:5432/paytm_db?sslmode=disable
PORT=8080
JWT_SECRET=your_jwt_secret_here
ENV=development
```

## License

This project is for educational purposes.
