"""Configuration settings for the application."""

class Config:
    """Base configuration class."""
    DEBUG = False
    TESTING = False
    SECRET_KEY = 'your-secret-key'  # In production, use environment variables for sensitive data


class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True


class TestingConfig(Config):
    """Testing environment configuration."""
    DEBUG = True
    TESTING = True


class ProductionConfig(Config):
    """Production environment configuration."""
    # Production specific settings
    pass
