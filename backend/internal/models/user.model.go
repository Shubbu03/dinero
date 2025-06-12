package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name         string `gorm:"not null"`
	Email        string `gorm:"uniqueIndex;not null"`
	Password     []byte
	AuthProvider string `gorm:"default:'email'"`
	ExternalID   string
	Balance      int64  `gorm:"not null;default:0"`
	Currency     string `gorm:"default:'USD'"`
	Avatar       string
	Friends      []*User       `gorm:"many2many:user_friends;joinForeignKey:UserID;joinReferences:FriendID"`
	Transactions []Transaction `gorm:"foreignKey:SenderID"`
}
