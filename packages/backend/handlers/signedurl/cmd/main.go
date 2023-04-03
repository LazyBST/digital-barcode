package signedurl

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
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
	// barcode := generateBarcode()
	// bucketName := "dev-digital-barcode-files-data"
	// url, err := aws.GeneratePresignedURL(bucketName, barcode+".pdf", time.Minute*10)
	// if err != nil {
	// 	fmt.Println("Error generating presigned URL:", err)
	// 	ctx.JSON(http.StatusInternalServerError, gin.H{
	// 		"error": err.Error(),
	// 	})
	// }

	httpClient := http.Client{Timeout: 5 * time.Minute}
	resp, err := httpClient.Get("http://34.222.158.209:80/signedURL")

	if err != nil {
		fmt.Println("Http cal error", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	fmt.Println("Http call resp:", resp)
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	fmt.Println("Http call read:", body)

	response := struct {
		UploadUrl string `json:"upload_url"`
		ObjectKey int    `json:"object_key"`
	}{}

	err = json.Unmarshal(body, &response)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"upload_url": response.UploadUrl,
		"object_key": response.ObjectKey,
	})
}
