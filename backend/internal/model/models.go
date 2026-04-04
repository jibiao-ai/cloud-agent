package model

import (
	"time"

	"gorm.io/gorm"
)

// User represents a platform user
type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Username  string         `gorm:"uniqueIndex;size:64;not null" json:"username"`
	Password  string         `gorm:"size:256;not null" json:"-"`
	Email     string         `gorm:"size:128" json:"email"`
	Role      string         `gorm:"size:32;default:user" json:"role"` // admin, user
	Avatar    string         `gorm:"size:512" json:"avatar"`
}

// Agent represents an AI agent configuration
type Agent struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Name        string         `gorm:"size:128;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	SystemPrompt string        `gorm:"type:text" json:"system_prompt"`
	Model       string         `gorm:"size:64" json:"model"`
	Temperature float64        `gorm:"default:0.7" json:"temperature"`
	MaxTokens   int            `gorm:"default:4096" json:"max_tokens"`
	Skills      string         `gorm:"type:text" json:"skills"` // JSON array of skill IDs
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedBy   uint           `json:"created_by"`
}

// Skill represents a capability/tool the agent can use
type Skill struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Name        string         `gorm:"size:128;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Type        string         `gorm:"size:32" json:"type"` // easystack_api, script, webhook
	Config      string         `gorm:"type:text" json:"config"` // JSON config
	IsActive    bool           `gorm:"default:true" json:"is_active"`
}

// Conversation represents a chat session
type Conversation struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Title     string         `gorm:"size:256" json:"title"`
	UserID    uint           `gorm:"index" json:"user_id"`
	AgentID   uint           `gorm:"index" json:"agent_id"`
	Agent     Agent          `gorm:"foreignKey:AgentID" json:"agent,omitempty"`
}

// Message represents a single message in a conversation
type Message struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
	ConversationID uint           `gorm:"index;not null" json:"conversation_id"`
	Role           string         `gorm:"size:16;not null" json:"role"` // user, assistant, system
	Content        string         `gorm:"type:longtext;not null" json:"content"`
	TokensUsed     int            `json:"tokens_used"`
	ToolCalls      string         `gorm:"type:text" json:"tool_calls,omitempty"` // JSON for tool calls
}

// TaskLog records async tasks processed via RabbitMQ
type TaskLog struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	TaskID    string         `gorm:"size:64;uniqueIndex" json:"task_id"`
	Type      string         `gorm:"size:64" json:"type"`   // easystack_api, scheduled_task
	Status    string         `gorm:"size:32" json:"status"` // pending, running, completed, failed
	Input     string         `gorm:"type:text" json:"input"`
	Output    string         `gorm:"type:text" json:"output"`
	Error     string         `gorm:"type:text" json:"error"`
	UserID    uint           `json:"user_id"`
}

// Workflow represents an automated workflow
type Workflow struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Name        string         `gorm:"size:128;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Steps       string         `gorm:"type:text" json:"steps"` // JSON workflow definition
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedBy   uint           `json:"created_by"`
}

// ScheduledTask represents a cron-like scheduled task
type ScheduledTask struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Name        string         `gorm:"size:128;not null" json:"name"`
	CronExpr    string         `gorm:"size:64" json:"cron_expr"`
	TaskType    string         `gorm:"size:64" json:"task_type"`
	Config      string         `gorm:"type:text" json:"config"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	LastRunAt   *time.Time     `json:"last_run_at"`
	NextRunAt   *time.Time     `json:"next_run_at"`
	CreatedBy   uint           `json:"created_by"`
}

// EasyStackEndpoint stores configured EasyStack service endpoints
type EasyStackEndpoint struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Name        string         `gorm:"size:128" json:"name"`
	ServiceType string         `gorm:"size:64" json:"service_type"` // compute, network, storage, identity
	URL         string         `gorm:"size:512" json:"url"`
	Version     string         `gorm:"size:16" json:"version"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
}
