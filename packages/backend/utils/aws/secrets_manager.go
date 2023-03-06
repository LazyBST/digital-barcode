package aws

import (
	"digital-barcode/packages/backend/utils/constants"
	"encoding/json"
	"os"
	"strconv"

	"github.com/aws/aws-secretsmanager-caching-go/secretcache"
)

var dbSecretStruct struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
}

var awsSecretCache *secretcache.Cache

func InitDBEnvParams(secretID string) error {
	jsonString, err := FetchSecret(secretID)
	if err != nil {
		return err
	}

	unmarshallErr := json.Unmarshal([]byte(jsonString), &dbSecretStruct)
	if unmarshallErr != nil {
		return unmarshallErr
	}

	portString := strconv.Itoa(dbSecretStruct.Port)
	var envMap = map[string]string{
		constants.EnvDBHostKey:     dbSecretStruct.Host,
		constants.EnvDBUsernameKey: dbSecretStruct.Username,
		constants.EnvDBPasswordKey: dbSecretStruct.Password,
		constants.EnvDBNameKey:     dbSecretStruct.Username,
		constants.EnvDBPortKey:     portString,
	}

	for k, v := range envMap {
		if envErr := os.Setenv(k, v); envErr != nil {
			return envErr
		}
	}

	return nil
}

func InitLocalDBEnvParams() error {
	var envMap = map[string]string{
		constants.EnvDBHostKey:     os.Getenv(constants.EnvDBHostKey),
		constants.EnvDBUsernameKey: os.Getenv(constants.EnvDBUsernameKey),
		constants.EnvDBPasswordKey: os.Getenv(constants.EnvDBPasswordKey),
		constants.EnvDBNameKey:     os.Getenv(constants.EnvDBNameKey),
		constants.EnvDBPortKey:     os.Getenv(constants.EnvDBPortKey),
	}

	for k, v := range envMap {
		if envErr := os.Setenv(k, v); envErr != nil {
			return envErr
		}
	}

	return nil
}

func FetchSecret(secretID string) (string, error) {
	if awsSecretCache == nil {
		var initErr error
		awsSecretCache, initErr = secretcache.New()
		if initErr != nil {
			return "", initErr
		}
	}

	return awsSecretCache.GetSecretString(secretID)
}
