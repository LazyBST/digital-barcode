package constants

import (
	"time"

	"github.com/gin-contrib/cors"
)

func DefaultCORSConfig() cors.Config {
	return cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Access-Control-Allow-Origin"},
		AllowCredentials: false,
		MaxAge:           365 * 24 * time.Hour,
		AllowAllOrigins:  true,
	}
}
