package mq

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/jibiao-ai/cloud-agent/internal/config"
	"github.com/jibiao-ai/cloud-agent/pkg/logger"
	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	QueueAgentTask   = "agent_task"
	QueueAPICall     = "api_call"
	QueueNotification = "notification"
)

type TaskMessage struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	UserID    uint                   `json:"user_id"`
	AgentID   uint                   `json:"agent_id"`
	Payload   map[string]interface{} `json:"payload"`
	CreatedAt time.Time              `json:"created_at"`
}

type RabbitMQ struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	cfg     config.RabbitMQConfig
}

func NewRabbitMQ(cfg config.RabbitMQConfig) *RabbitMQ {
	return &RabbitMQ{cfg: cfg}
}

func (r *RabbitMQ) Connect() error {
	url := fmt.Sprintf("amqp://%s:%s@%s:%d/%s",
		r.cfg.User, r.cfg.Password, r.cfg.Host, r.cfg.Port, r.cfg.VHost)

	var conn *amqp.Connection
	var err error

	// Retry with backoff; use MQ_RETRIES env to control (default 1 for dev, set 30 for production)
	maxRetries := 1
	if os.Getenv("MQ_RETRIES") != "" {
		fmt.Sscanf(os.Getenv("MQ_RETRIES"), "%d", &maxRetries)
	}
	for i := 0; i < maxRetries; i++ {
		conn, err = amqp.Dial(url)
		if err == nil {
			break
		}
		logger.Log.Warnf("Failed to connect to RabbitMQ (attempt %d/%d): %v", i+1, maxRetries, err)
		if i < maxRetries-1 {
			time.Sleep(2 * time.Second)
		}
	}
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open channel: %w", err)
	}

	// Declare queues
	queues := []string{QueueAgentTask, QueueAPICall, QueueNotification}
	for _, q := range queues {
		_, err := ch.QueueDeclare(q, true, false, false, false, nil)
		if err != nil {
			return fmt.Errorf("failed to declare queue %s: %w", q, err)
		}
	}

	r.conn = conn
	r.channel = ch
	logger.Log.Info("RabbitMQ connection established")
	return nil
}

func (r *RabbitMQ) IsConnected() bool {
	return r.channel != nil && r.conn != nil
}

func (r *RabbitMQ) Publish(queue string, msg TaskMessage) error {
	if r.channel == nil {
		logger.Log.Warn("RabbitMQ not connected, skipping publish")
		return nil
	}
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = r.channel.PublishWithContext(ctx,
		"",    // exchange
		queue, // routing key
		false, // mandatory
		false, // immediate
		amqp.Publishing{
			DeliveryMode: amqp.Persistent,
			ContentType:  "application/json",
			Body:         body,
			Timestamp:    time.Now(),
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	logger.Log.Debugf("Published message to queue %s: %s", queue, msg.ID)
	return nil
}

func (r *RabbitMQ) Consume(queue string, handler func(TaskMessage) error) error {
	if r.channel == nil {
		logger.Log.Warn("RabbitMQ not connected, skipping consume")
		return nil
	}
	msgs, err := r.channel.Consume(
		queue,
		"",    // consumer
		false, // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	go func() {
		for d := range msgs {
			var msg TaskMessage
			if err := json.Unmarshal(d.Body, &msg); err != nil {
				logger.Log.Errorf("Failed to unmarshal message: %v", err)
				d.Nack(false, false)
				continue
			}

			if err := handler(msg); err != nil {
				logger.Log.Errorf("Failed to handle message %s: %v", msg.ID, err)
				d.Nack(false, true) // requeue
				continue
			}

			d.Ack(false)
		}
	}()

	logger.Log.Infof("Started consuming from queue: %s", queue)
	return nil
}

func (r *RabbitMQ) Close() {
	if r.channel != nil {
		r.channel.Close()
	}
	if r.conn != nil {
		r.conn.Close()
	}
}
