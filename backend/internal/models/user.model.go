package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name         string        `gorm:"not null"`
	Email        string        `gorm:"uniqueIndex;not null"`
	Password     []byte        `gorm:"not null"`
	Balance      float64       `gorm:"default:0"`
	Friends      []*User       `gorm:"many2many:user_friends;joinForeignKey:UserID;joinReferences:FriendID"`
	Transactions []Transaction `gorm:"foreignKey:SenderID"`
}
