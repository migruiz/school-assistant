import './App.css'
import AssistantChat from './components/AssistantChat'
import './components/AssistantChat.css'

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>School Assistant</h1>
        <p>Your AI-powered educational helper</p>
      </header>
      <main>
        <AssistantChat />
      </main>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} School Assistant</p>
      </footer>
    </div>
  )
}

export default App
