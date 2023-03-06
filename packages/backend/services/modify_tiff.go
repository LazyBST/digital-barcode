package services

import (
	"bytes"
	"fmt"
	"image/jpeg"

	"github.com/jung-kurt/gofpdf"
)

func InsertImageIntoPdfHeader(pdfBytes []byte, imageBytes []byte) ([]byte, error) {
	// Create PDF object from bytes
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	err := pdf.Error()
	if err != nil {
		return nil, err
	}
	pdf.SetHeaderFunc(func() {
		// Insert image in header of first page
		if pdf.PageNo() == 1 {
			_, err := jpeg.Decode(bytes.NewReader(imageBytes))
			if err != nil {
				fmt.Println(err)
				return
			}
			// pdf.ImageOptions(imageFilePath, 10, 10, 40, 0, false, gofpdf.ImageOptions{ImageType: "jpg", ReadDpi: true}, 0, "")
		}
	})

	// Write PDF to buffer
	buffer := bytes.NewBuffer([]byte{})
	err = pdf.Output(buffer)
	if err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}
