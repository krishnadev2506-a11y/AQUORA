from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AQUORA"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./aquora.db"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

settings = Settings()
