package barcode

import (
	"digital-barcode/packages/backend/utils/aws"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Request struct {
	ObjectKey string `json:"object_key"`
}

func BarcodeHandler(ctx *gin.Context) {
	payload, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	requesPayload := &Request{}

	if err = json.Unmarshal(payload, requesPayload); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	pdfBytes, err := aws.ReadPDFFromS3("dev-digital-barcode-files-data", requesPayload.ObjectKey+".pdf")
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

	url, err := aws.UploadTIFFToS3("dev-digital-barcode-files-data", requesPayload.ObjectKey+".tiff", pdfBytes, "us-west-2", 60)
	if err != nil {
		panic(err)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"tiff_url": url,
	})
}
