package main

import (
	"context"
	"digital-barcode/packages/backend/utils/aws"
	"digital-barcode/packages/backend/utils/constants"
	"errors"
	"fmt"
	"log"
	"net/url"
	"runtime/debug"

	"github.com/amacneil/dbmate/pkg/dbmate"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/getsentry/sentry-go"

	_ "github.com/amacneil/dbmate/pkg/driver/postgres"

	"os"
)

var dbmateClient *dbmate.DB

func init() {
	dbSecretName := os.Getenv(constants.EnvDBSecretNameKey)
	dbEnvErr := aws.InitDBEnvParams(dbSecretName)
	if dbEnvErr != nil {
		sentry.CaptureException(dbEnvErr)
		log.Printf("error initialising DB secrets %s", dbEnvErr.Error())

		return
	}

	urlString := fmt.Sprintf(`postgres://%s:%s@%s:%s/%s`,
		os.Getenv(constants.EnvDBUsernameKey),
		os.Getenv(constants.EnvDBPasswordKey),
		os.Getenv(constants.EnvDBHostKey),
		os.Getenv(constants.EnvDBPortKey),
		os.Getenv(constants.EnvDBNameKey))

	dbURL, parseErr := url.Parse(urlString)
	if parseErr != nil {
		panic(parseErr)
	}

	dbmateClient = dbmate.New(dbURL)
}

type input struct {
	Action string `json:"action"`
}

func main() {
	lambda.Start(logAndHandle)
}

func logAndHandle(ctx context.Context, i input) error {
	err := handle(ctx, i)
	if err != nil {
		log.Println(err.Error())
		log.Println(string(debug.Stack()))

		return err
	}

	return nil
}

func handle(ctx context.Context, i input) (err error) {
	switch i.Action {
	case "up", "migrate":
		err = dbmateClient.CreateAndMigrate()
		return

	case "down":
		err = dbmateClient.Rollback()
		return

	default:
		err = errors.New("invalid action")
		return
	}
}
