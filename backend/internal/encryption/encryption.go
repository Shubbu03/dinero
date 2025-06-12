package encryption

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"os"
)

type EncryptionService struct {
	gcm cipher.AEAD
}

func NewEncryptionService() (*EncryptionService, error) {
	keyString := os.Getenv("CARD_ENCRYPTION_KEY")
	if keyString == "" {
		return nil, fmt.Errorf("CARD_ENCRYPTION_KEY environment variable is not set")
	}

	var key []byte
	var err error

	if len(keyString)%2 == 0 && len(keyString) >= 32 {
		key, err = hex.DecodeString(keyString)
		if err != nil {
			key = []byte(keyString)
		}
	} else {
		key = []byte(keyString)
	}

	if len(key) != 32 {
		return nil, fmt.Errorf("encryption key must be 32 bytes, got %d bytes. "+
			"Provide either a 32-byte string or a 64-character hex string", len(key))
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	return &EncryptionService{gcm: gcm}, nil
}

func (e *EncryptionService) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", fmt.Errorf("plaintext cannot be empty")
	}

	nonce := make([]byte, e.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	ciphertext := e.gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (e *EncryptionService) Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", fmt.Errorf("ciphertext cannot be empty")
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	nonceSize := e.gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, encryptedData := data[:nonceSize], data[nonceSize:]
	plaintext, err := e.gcm.Open(nil, nonce, encryptedData, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}
