import { useState } from 'react';
import { assistantService } from '../services/api';

function AssistantChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await assistantService.sendMessage(message);
      setResponse(result);
      setMessage('');
    } catch (err) {
      setError('Failed to connect to the assistant. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-chat">
      <h2>School Assistant</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {response && (
        <div className="response">
          <h3>Assistant Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask the assistant something..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !message.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AssistantChat;
