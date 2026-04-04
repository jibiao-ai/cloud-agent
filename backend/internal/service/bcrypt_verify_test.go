package service

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

// TestAdminBcryptHash verifies that the default admin user's stored bcrypt hash
// matches the plaintext password "admin123".
func TestAdminBcryptHash(t *testing.T) {
	const hash = "$2a$10$5HCtytk2H8rwfdEB9ysMcepF3tLhnpiPE5XoktVUMwMOgyF2quBlO"
	const password = "admin123"

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		t.Fatalf("bcrypt hash does NOT match 'admin123': %v", err)
	}
	t.Logf("✓ bcrypt hash correctly matches 'admin123'")
}
