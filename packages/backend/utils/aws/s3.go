package aws

import (
	"time"

	"io/ioutil"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"

	"bytes"
)

// GeneratePresignedURL generates a presigned URL for uploading a PDF file to S3
func GeneratePresignedURL(bucketName, objectKey string, expires time.Duration) (string, error) {
	// create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-west-2"), // replace with your desired region
	})
	if err != nil {
		return "", err
	}

	// create S3 service client
	svc := s3.New(sess)

	// create input for presigned URL request
	req, _ := svc.PutObjectRequest(&s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(objectKey),
		ContentType: aws.String("application/pdf"),
		ACL:         aws.String("public-read"), // replace with your desired ACL
	})
	if err != nil {
		return "", err
	}

	// generate presigned URL with expiration time
	url, err := req.Presign(expires)
	if err != nil {
		return "", err
	}

	return url, nil
}

// ReadPDFFromS3 reads a PDF file from S3 and returns its content as bytes
func ReadPDFFromS3(bucketName, objectKey string) ([]byte, error) {
	// create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-west-2"), // replace with your desired region
	})
	if err != nil {
		return nil, err
	}

	// create S3 service client
	svc := s3.New(sess)

	// create input for getObject request
	input := &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	}

	// get object content
	result, err := svc.GetObject(input)
	if err != nil {
		return nil, err
	}
	defer result.Body.Close()

	// read object content into bytes
	bodyBytes, err := ioutil.ReadAll(result.Body)
	if err != nil {
		return nil, err
	}

	return bodyBytes, nil
}

// UploadTIFFToS3 uploads a TIFF file to S3 and returns a presigned URL for accessing the file
func UploadTIFFToS3(bucket string, key string, tiffBytes []byte, region string, expiresInMinutes int64) (string, error) {
	// create new S3 session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return "", err
	}

	// create new S3 client
	svc := s3.New(sess)

	// upload TIFF bytes to S3
	_, err = svc.PutObject(&s3.PutObjectInput{
		Body:   bytes.NewReader(tiffBytes),
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return "", err
	}

	// generate presigned URL for accessing uploaded file
	req, _ := svc.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	urlStr, err := req.Presign(time.Duration(expiresInMinutes * 60))
	if err != nil {
		return "", err
	}

	return urlStr, nil
}
