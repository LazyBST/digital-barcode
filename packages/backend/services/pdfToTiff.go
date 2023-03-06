package services

import (
	"bytes"
	"errors"
	"image"
	"image/png"

	"github.com/otiai10/gosseract"
	"github.com/signintech/gopdf"
)

func PDFToTIFF(pdfBytes []byte) ([]byte, error) {
	// Load the PDF document from bytes
	pdfDoc, err := gopdf.GoPdf{}.InitFromBytes(pdfBytes)
	if err != nil {
		return nil, err
	}

	// Render each page of the PDF as an image
	var images []image.Image
	for i := 1; i <= pdfDoc.GetNumberOfPages(); i++ {
		page := pdfDoc.GetPage(i)
		pageImage := page.RenderToImage(300, 300)
		images = append(images, pageImage)
	}

	// Convert the images to TIFF format and concatenate them into a single file
	var tiffBytes []byte
	for _, img := range images {
		tiffBuf := new(bytes.Buffer)
		err = png.Encode(tiffBuf, img)
		if err != nil {
			return nil, err
		}
		tiffBytes = append(tiffBytes, tiffBuf.Bytes()...)
	}

	if len(tiffBytes) == 0 {
		return nil, errors.New("no pages found in PDF document")
	}

	// Perform OCR on the resulting TIFF file to ensure it is valid
	_, err = gosseract.NewClient().ImageFromBytes(tiffBytes).Text()
	if err != nil {
		return nil, err
	}

	return tiffBytes, nil
}
