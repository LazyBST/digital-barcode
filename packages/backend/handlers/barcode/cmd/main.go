package barcode

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Request struct {
	ObjectKey       string `json:"object_key"`
	BarcodePosition string `json:"barcode_position"`
	ExportType      string `json:"export_type"`
}

func BarcodeHandler(ctx *gin.Context) {
	payload, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	requestPayload := &Request{}

	if err = json.Unmarshal(payload, requestPayload); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// bucketName := "dev-digital-barcode-files-data"
	// pdfBytes, err := aws.ReadPDFFromS3(bucketName, requesPayload.ObjectKey+".pdf")
	// if err != nil {
	// 	ctx.JSON(http.StatusInternalServerError, gin.H{
	// 		"error": err.Error(),
	// 	})
	// 	return
	// }

	// fmt.Println("pdfBytes", bucketName)

	request := struct {
		Params struct {
			BarCodeText     string `json:"barCodeText"`
			BarcodePosition string `json:"barcode_position"`
			ExportType      string `json:"export_type"`
		} `json:"params"`
	}{}
	request.Params.BarCodeText = requestPayload.ObjectKey
	request.Params.BarcodePosition = requestPayload.BarcodePosition
	request.Params.ExportType = requestPayload.ExportType

	requestBody, err := json.Marshal(request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	fmt.Println("Http call")
	httpClient := http.Client{Timeout: 5 * time.Minute}
	resp, err := httpClient.Post(
		"http://34.222.158.209:80/barcode",
		"application/json",
		bytes.NewBuffer(requestBody))
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
		TiffUrl string `json:"tiff_url"`
	}{}

	err = json.Unmarshal(body, &response)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// _, err := services.GenerateBarcodeImage(requesPayload.ObjectKey)
	// if err != nil {
	// 	ctx.JSON(http.StatusInternalServerError, gin.H{
	// 		"error": err.Error(),
	// 	})
	// 	return
	// }

	// tiffBytes, err := services.PDFToTIFF(pdfBytes)
	// if err != nil {
	// 	ctx.JSON(http.StatusInternalServerError, gin.H{
	// 		"error": err.Error(),
	// 	})
	// 	return
	// }

	// // insert image on first page of PDF file
	// newTiffBytes, err := services.InsertImageInTIFF(tiffBytes, barcodeImage)
	// if err != nil {
	// 	ctx.JSON(http.StatusInternalServerError, gin.H{
	// 		"error": err.Error(),
	// 	})
	// 	return
	// }

	// url, err := aws.UploadTIFFToS3(bucketName, requesPayload.ObjectKey+".tiff", response.Data.TiffBytes, "us-west-2", 60)
	// if err != nil {
	// 	panic(err)
	// }

	ctx.JSON(http.StatusOK, gin.H{
		"tiff_url": response.TiffUrl,
	})
}
