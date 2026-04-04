package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jibiao-ai/cloud-agent/internal/model"
	"github.com/jibiao-ai/cloud-agent/internal/service"
	"github.com/jibiao-ai/cloud-agent/pkg/logger"
	"github.com/jibiao-ai/cloud-agent/pkg/response"
)

type Handler struct {
	chatService *service.ChatService
}

func NewHandler(chatService *service.ChatService) *Handler {
	return &Handler{chatService: chatService}
}

// ==================== Auth ====================

func (h *Handler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}

	resp, err := service.Login(req)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, resp)
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")
	var user model.User
	if err := service.GetUserByID(userID, &user); err != nil {
		response.InternalError(c, "user not found")
		return
	}
	response.Success(c, user)
}

// ==================== Dashboard ====================

func (h *Handler) GetDashboard(c *gin.Context) {
	userID := c.GetUint("user_id")
	stats, err := h.chatService.GetDashboardStats(userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, stats)
}

// ==================== Agents ====================

func (h *Handler) ListAgents(c *gin.Context) {
	agents, err := h.chatService.GetAgents()
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, agents)
}

func (h *Handler) GetAgent(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	agent, err := h.chatService.GetAgent(uint(id))
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, agent)
}

func (h *Handler) CreateAgent(c *gin.Context) {
	var agent model.Agent
	if err := c.ShouldBindJSON(&agent); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	agent.CreatedBy = c.GetUint("user_id")
	if err := h.chatService.CreateAgent(&agent); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, agent)
}

func (h *Handler) UpdateAgent(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var agent model.Agent
	if err := c.ShouldBindJSON(&agent); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	agent.ID = uint(id)
	if err := h.chatService.UpdateAgent(&agent); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, agent)
}

func (h *Handler) DeleteAgent(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := h.chatService.DeleteAgent(uint(id)); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, nil)
}

// ==================== Conversations ====================

func (h *Handler) ListConversations(c *gin.Context) {
	userID := c.GetUint("user_id")
	convs, err := h.chatService.GetConversations(userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, convs)
}

func (h *Handler) CreateConversation(c *gin.Context) {
	var req struct {
		AgentID uint   `json:"agent_id" binding:"required"`
		Title   string `json:"title"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request: agent_id is required")
		return
	}
	if req.Title == "" {
		req.Title = "新会话"
	}
	userID := c.GetUint("user_id")
	conv, err := h.chatService.CreateConversation(userID, req.AgentID, req.Title)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, conv)
}

func (h *Handler) DeleteConversation(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	userID := c.GetUint("user_id")
	if err := h.chatService.DeleteConversation(uint(id), userID); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, nil)
}

// ==================== Messages ====================

func (h *Handler) GetMessages(c *gin.Context) {
	convID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	userID := c.GetUint("user_id")
	msgs, err := h.chatService.GetMessages(uint(convID), userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, msgs)
}

func (h *Handler) SendMessage(c *gin.Context) {
	convID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	userID := c.GetUint("user_id")

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "content is required")
		return
	}

	userMsg, assistantMsg, err := h.chatService.SendMessage(uint(convID), userID, req.Content, nil)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"user_message":      userMsg,
		"assistant_message": assistantMsg,
	})
}

// ==================== WebSocket Chat ====================

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSMessage struct {
	Type           string `json:"type"` // message, heartbeat
	Content        string `json:"content,omitempty"`
	ConversationID uint   `json:"conversation_id,omitempty"`
}

func (h *Handler) WebSocketChat(c *gin.Context) {
	userID := c.GetUint("user_id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Log.Errorf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	var mu sync.Mutex

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				logger.Log.Errorf("WebSocket read error: %v", err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(msgBytes, &wsMsg); err != nil {
			continue
		}

		if wsMsg.Type == "heartbeat" {
			mu.Lock()
			conn.WriteJSON(WSMessage{Type: "heartbeat"})
			mu.Unlock()
			continue
		}

		if wsMsg.Type == "message" && wsMsg.Content != "" {
			// Send typing indicator
			mu.Lock()
			conn.WriteJSON(gin.H{"type": "typing", "content": ""})
			mu.Unlock()

			// Process message
			go func() {
				userMsg, assistantMsg, err := h.chatService.SendMessage(wsMsg.ConversationID, userID, wsMsg.Content, nil)
				mu.Lock()
				defer mu.Unlock()

				if err != nil {
					conn.WriteJSON(gin.H{
						"type":    "error",
						"content": err.Error(),
					})
					return
				}

				conn.WriteJSON(gin.H{
					"type":              "user_message",
					"message":           userMsg,
					"conversation_id":   wsMsg.ConversationID,
				})
				conn.WriteJSON(gin.H{
					"type":              "assistant_message",
					"message":           assistantMsg,
					"conversation_id":   wsMsg.ConversationID,
				})
			}()
		}
	}
}

// ==================== Skills ====================

func (h *Handler) ListSkills(c *gin.Context) {
	skills, err := h.chatService.GetSkills()
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, skills)
}

// ==================== Workflows ====================

func (h *Handler) ListWorkflows(c *gin.Context) {
	workflows, err := h.chatService.GetWorkflows()
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, workflows)
}

func (h *Handler) CreateWorkflow(c *gin.Context) {
	var wf model.Workflow
	if err := c.ShouldBindJSON(&wf); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	wf.CreatedBy = c.GetUint("user_id")
	if err := h.chatService.CreateWorkflow(&wf); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, wf)
}

// ==================== Scheduled Tasks ====================

func (h *Handler) ListScheduledTasks(c *gin.Context) {
	tasks, err := h.chatService.GetScheduledTasks()
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, tasks)
}

func (h *Handler) CreateScheduledTask(c *gin.Context) {
	var task model.ScheduledTask
	if err := c.ShouldBindJSON(&task); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	task.CreatedBy = c.GetUint("user_id")
	if err := h.chatService.CreateScheduledTask(&task); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, task)
}

// ==================== Users (Admin) ====================

func (h *Handler) ListUsers(c *gin.Context) {
	users, err := h.chatService.GetUsers()
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, users)
}

func (h *Handler) CreateUser(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	if err := h.chatService.CreateUser(&user); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, user)
}

func (h *Handler) UpdateUser(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	user.ID = uint(id)
	if err := h.chatService.UpdateUser(&user); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, user)
}

func (h *Handler) DeleteUser(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := h.chatService.DeleteUser(uint(id)); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, nil)
}

// ==================== Task Logs ====================

func (h *Handler) ListTaskLogs(c *gin.Context) {
	userID := c.GetUint("user_id")
	logs, err := h.chatService.GetTaskLogs(userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Success(c, logs)
}
