"""API routes module."""
from flask import Blueprint, jsonify, request

from openai import OpenAI
client = OpenAI()

response = client.beta.threads.runs.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Write a one-sentence bedtime story about a unicorn."}
    ]
)
print(response.output_text)


api_bp = Blueprint('api', __name__)


@api_bp.route('/assistant', methods=['POST'])
def assistant():
    """Main endpoint for the AI Assistant."""
    data = request.get_json()
    
    # Here you would integrate with your AI logic
    
    response = {
        'message': 'AI Assistant received your message',
        'received_data': data,
        # 'response': ... AI response will go here
    }
    
    return jsonify(response)


@api_bp.route('/assistant/history', methods=['GET'])
def get_history():
    """Get conversation history."""
    # Here you would implement retrieval of conversation history
    
    return jsonify({
        'history': []  # Placeholder for actual history data
    })


@api_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Not found'}), 404


@api_bp.errorhandler(500)
def server_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Server error'}), 500
