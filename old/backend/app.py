from flask import Flask, jsonify
from flask_cors import CORS
from routes.api import api_bp

def create_app(config_name='development'):
    """Create and configure the Flask application."""
    app = Flask(__name__, static_folder='client/build', static_url_path='')
    
    # Enable CORS
    CORS(app)
    
    # Load configuration based on environment
    app.config.from_object(f'config.{config_name.capitalize()}Config')
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api/v1')
    
    # Simple health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy"})
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=app.config.get('DEBUG', False))
