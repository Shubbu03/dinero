package models

import (
	"time"

	"gorm.io/gorm"
)

type TransactionType string
type PaymentMethod string

const (
	TransactionSent     TransactionType = "sent"
	TransactionReceived TransactionType = "received"
	TransactionSelf     TransactionType = "self"
)

const (
	PaymentMethodBalance PaymentMethod = "balance"
	PaymentMethodCard    PaymentMethod = "card"
	PaymentMethodUPI     PaymentMethod = "upi"
)

type Transaction struct {
	gorm.Model
	SenderID      uint
	ReceiverID    uint
	Amount        int64 `gorm:"not null"`
	Fee           int64 `gorm:"default:0"`
	Description   string
	Type          TransactionType `gorm:"type:varchar(20);not null"`
	PaymentMethod PaymentMethod   `gorm:"type:varchar(20);default:'balance'"`
	CardID        *uint
	Status        string    `gorm:"default:'completed'"`
	Timestamp     time.Time `gorm:"autoCreateTime"`

	Sender   *User `gorm:"foreignKey:SenderID"`
	Receiver User  `gorm:"foreignKey:ReceiverID"`
	Card     *Card `gorm:"foreignKey:CardID"`
}
