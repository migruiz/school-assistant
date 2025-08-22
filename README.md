# School Assistant AI API

A REST API for an AI Assistant designed to help with school-related tasks and questions.

## Project Structure

```
school-assistant/
├── app.py            # Main application entry point
├── config.py         # Configuration settings
├── routes/           # API routes and endpoints
│   ├── __init__.py
│   └── api.py        # API endpoints
├── models/           # Data models
│   ├── __init__.py
│   └── conversation.py  # Conversation and message models
├── services/         # Business logic
│   ├── __init__.py
│   └── assistant.py  # AI Assistant service
└── README.md         # This file
```

## Setup and Installation

1. Create a virtual environment (already done):
   ```
   python -m venv .venv
   ```

2. Activate the virtual environment:
   ```
   # On Windows
   .\.venv\Scripts\activate
   
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install flask
   ```

## Running the Application

To run the application:

```
python app.py
```

The API will be available at http://127.0.0.1:5000/

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/v1/assistant` - Send a message to the AI assistant
- `GET /api/v1/assistant/history` - Get conversation history

## Next Steps for Development

1. Integrate actual AI model or service
2. Add database for storing conversations
3. Implement user authentication
4. Add more specialized endpoints for school-related tasks
5. Set up testing framework
