package models

import (
	"time"

	"gorm.io/gorm"
)

type CardType string

const (
	CardTypeVISA       CardType = "VISA"
	CardTypeMasterCard CardType = "MC"
	CardTypeAmex       CardType = "AMEX"
	CardTypeDiscover   CardType = "DISC"
)

type Card struct {
	gorm.Model
	UserID       uint     `gorm:"not null;index"`
	CardToken    string   `gorm:"not null"`
	MaskedNumber string   `gorm:"not null"`
	CardType     CardType `gorm:"type:varchar(10);not null"`
	HolderName   string   `gorm:"not null"`
	ExpiryMonth  string   `gorm:"not null"`
	ExpiryYear   string   `gorm:"not null"`
	IsActive     bool     `gorm:"default:true"`
	LastUsedAt   *time.Time

	User         User          `gorm:"foreignKey:UserID"`
	Transactions []Transaction `gorm:"foreignKey:CardID"`
}

func (Card) TableName() string {
	return "cards"
}
