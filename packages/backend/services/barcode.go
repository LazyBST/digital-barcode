package services

import (
	"bytes"
	"image/png"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
)

// GenerateBarcodeImage returns a PNG image of a QR code representing the given text
func GenerateBarcodeImage(text string) ([]byte, error) {
	// create QR code
	qrCode, err := qr.Encode(text, qr.M, qr.Auto)
	if err != nil {
		return nil, err
	}

	// scale barcode to 256x256 pixels
	qrCode, err = barcode.Scale(qrCode, 256, 256)
	if err != nil {
		return nil, err
	}

	// create PNG image buffer
	imageBuf := new(bytes.Buffer)

	// encode barcode as PNG image
	err = png.Encode(imageBuf, qrCode)
	if err != nil {
		return nil, err
	}

	// return PNG image bytes
	return imageBuf.Bytes(), nil
}

// func main() {
// 	// generate barcode image for "Hello, world!"
// 	barcodeImage, err := GenerateBarcodeImage("Hello, world!")
// 	if err != nil {
// 		panic(err)
// 	}

// 	// do something with barcode image bytes
// }
