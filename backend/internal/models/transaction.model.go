package models

import (
	"time"

	"gorm.io/gorm"
)

type Transaction struct {
	gorm.Model
	SenderID    uint
	ReceiverID  uint
	Amount      float64 `gorm:"not null"`
	Description string
	Timestamp   time.Time `gorm:"autoCreateTime"`

	Sender   User `gorm:"foreignKey:SenderID"`
	Receiver User `gorm:"foreignKey:ReceiverID"`
}
