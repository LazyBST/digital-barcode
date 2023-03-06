package signedurl

import (
	"digital-barcode/packages/backend/utils/aws"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"math/rand"

	"github.com/gin-gonic/gin"
)

func generateBarcode() string {
	rand.Seed(time.Now().UnixNano())

	// Generate a random integer between 1000000000 and 9999999999
	barcode := rand.Intn(9000000000) + 1000000000

	// Convert the integer to a string
	return strconv.Itoa(barcode)
}

func SignedUrlHandler(ctx *gin.Context) {
	barcode := generateBarcode()
	url, err := aws.GeneratePresignedURL("dev-digital-barcode-files-data", barcode+".pdf", time.Minute*5)
	if err != nil {
		fmt.Println("Error generating presigned URL:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
	}

	ctx.JSON(http.StatusOK, gin.H{
		"upload_url": url,
		"object_key": barcode,
	})
}
