package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name         string        `gorm:"not null"`
	Email        string        `gorm:"uniqueIndex;not null"`
	Password     []byte        `gorm:"default:null"`
	AuthProvider string        `gorm:"default:'email'"`
	ExternalID   string        `gorm:"default:null"`
	Balance      int64         `gorm:"not null;default:0"`
	Avatar       string        `gorm:"default:null"`
	Friends      []*User       `gorm:"many2many:user_friends;joinForeignKey:UserID;joinReferences:FriendID"`
	Transactions []Transaction `gorm:"foreignKey:SenderID"`
}
