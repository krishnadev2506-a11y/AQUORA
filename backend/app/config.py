from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AQUORA"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./aquora.db"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
