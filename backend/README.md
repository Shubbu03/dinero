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
- **Card Management**
  - Add/remove payment cards
  - Secure card encryption (AES-GCM)
  - Card type detection (VISA, MC, AMEX, Discover)
  - Masked card number display
  - Add money via card payments with fees

## Test Card Numbers

For testing purposes, you can use any card numbers with basic format validation:

```
Simple Test Cards (any will work):
- 4111111111111111 (CVV: 123, Expiry: 12/25)
- 5555555555554444 (CVV: 123, Expiry: 12/25)
- 3782822463100005 (CVV: 123, Expiry: 12/25) - AMEX 15 digits
- 6011111111111117 (CVV: 123, Expiry: 12/25)
- 1234567890123456 (CVV: 123, Expiry: 12/25) - Any 13-19 digit number
```

**Card Validation Rules:**

- Card Number: 13-19 digits
- CVV: 3-4 digits
- Expiry Month: 01-12
- Expiry Year: 00-99
- Cardholder Name: 2-50 characters

**Note**: This is for demo/testing purposes only with simplified validation.

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
# Database Configuration
DB_URL=postgres://username:password@localhost:5432/paytm_db?sslmode=disable

# Server Configuration
PORT=8080
ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_TTL=15  # minutes
JWT_REFRESH_TTL=168  # hours (7 days)

# OAuth Configuration (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8080

# Cookie settings (for production)
COOKIE_DOMAIN=
SESSION_SECRET=your-session-secret-for-oauth-state

# Card Encryption (REQUIRED - must be exactly 32 bytes)
# You can use either:
# 1. A 64-character hex string (like the one below) - will be decoded to 32 bytes
# 2. A raw 32-byte string
CARD_ENCRYPTION_KEY

# Migration settings
RUN_MIGRATIONS=true  # Set to false in production
```

## License

This project is for educational purposes.
