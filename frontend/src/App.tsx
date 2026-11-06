import { useState, useEffect } from 'react'
import './App.css'

interface ApiStatus {
  status: string
  service: string
  timestamp: string
}

function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

  useEffect(() => {
    // Comprobación de conectividad inicial con el Backend NestJS
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then((data: ApiStatus) => {
        setApiStatus(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [apiUrl])

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <h1>Juliam Corp LLC</h1>
          <p className="subtitle">Sistema Centralizado de Gestión de Inventario</p>
        </div>
        <div className="badge-tag">MVP Web - Fase B</div>
      </header>

      <main className="app-main">
        <section className="status-card">
          <h2>Estado del Entorno Inicial (Paso 1)</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Frontend:</span>
              <span className="value tag-success">React + Vite + TypeScript (Puerto 3000)</span>
            </div>
            <div className="status-item">
              <span className="label">Backend API:</span>
              <span className="value">
                {loading && <span className="tag-warning">Verificando conexión...</span>}
                {apiStatus && <span className="tag-success">Conectado (Puerto 3001)</span>}
                {error && <span className="tag-info">Listo para enlazar con Docker ({apiUrl})</span>}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Base de Datos:</span>
              <span className="value tag-neutral">PostgreSQL (Puerto 5432)</span>
            </div>
          </div>
          {apiStatus && (
            <div className="api-response-box">
              <p><strong>Respuesta de la API:</strong> {apiStatus.service}</p>
              <small>Timestamp: {apiStatus.timestamp}</small>
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>Juliam Corp LLC &bull; Almacén Central &bull; Solución de Inventario 2026</p>
      </footer>
    </div>
  )
}

export default App

