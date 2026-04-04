package service

import (
	"github.com/jibiao-ai/cloud-agent/internal/model"
	"github.com/jibiao-ai/cloud-agent/internal/repository"
)

func GetUserByID(id uint, user *model.User) error {
	return repository.DB.First(user, id).Error
}
