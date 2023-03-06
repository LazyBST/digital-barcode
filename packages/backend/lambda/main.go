package main

import (
	"context"
	barcode "digital-barcode/packages/backend/handlers/barcode/cmd"
	signedurl "digital-barcode/packages/backend/handlers/signedurl/cmd"
	"digital-barcode/packages/backend/utils/constants"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

// func main() {
// 	if envErr := godotenv.Load(".env"); envErr != nil {
// 		panic(envErr)
// 	}

// 	r := gin.Default()
// 	r.GET("/signedURL", func(ctx *gin.Context) {
// 		signedurl.SignedUrlHandler(ctx)
// 	})
// 	r.POST("/barcode", func(ctx *gin.Context) {
// 		barcode.BarcodeHandler(ctx)
// 	})

// 	r.Run(":80")
// }

var ginLambda *ginadapter.GinLambda

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// web server
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.Use(cors.New(constants.DefaultCORSConfig()))

	if os.Getenv(constants.IsOffline) != constants.TrueString {
		r.Use(gzip.Gzip(gzip.DefaultCompression))
	}

	r.GET("/signedURL", func(ctx *gin.Context) {
		signedurl.SignedUrlHandler(ctx)
	})
	r.POST("/barcode", func(ctx *gin.Context) {
		barcode.BarcodeHandler(ctx)
	})

	ginLambda = ginadapter.New(r)

	// If no name is provided in the HTTP request body, throw an error
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	lambda.Start(Handler)
}
