package constants

const (
	// Environment placeholders

	EnvAWSRegion     = "REGION"
	EnvDebugKey      = "IS_DEBUG"
	EnvServerPortKey = "port"
	EnvStageKey      = "STAGE"

	BasicAuthAPIClient = "api"

	// PostgreSQL
	EnvDBSecretNameKey = "DB_SECRET_NAME"
	EnvDBHostKey       = "POSTGRESQL_HOST"
	EnvDBUsernameKey   = "POSTGRESQL_USERNAME"
	EnvDBPasswordKey   = "POSTGRESQL_PASSWORD"
	EnvDBPortKey       = "POSTGRESQL_PORT"
	EnvDBNameKey       = "POSTGRESQL_DB"

	EnvSentryDSNKey = "SENTRY_DSN"

	IsOffline  = "IS_OFFLINE"
	TrueString = "true"
)
