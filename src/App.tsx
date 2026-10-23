import { useEffect, useState } from 'react'
import './App.css'

type ApiResponse = {
  status: number
  label: string
  body: Record<string, unknown>
}

const missions = [
  {
    title: 'The Missing Turkey',
    description:
      'The kitchen has order #1042 ready, but the delivery app can’t find it.',
    goal: 'Retrieve order #1042.',
    method: 'GET',
    endpoint: '/api/order/1042',
    body: '',
    reference: 'GET /api/orders/:id',
    referenceDescription: 'Retrieve an order by its ID.',
    hint: 'Compare the route names. Should “order” be plural?',
    mascot: '🦃',
    celebration: 'The turkey is on its way!',
  },
  {
    title: 'Who Ordered 400 Pies?',
    description:
      'Someone requested 400 pumpkin pies. The kitchen needs just 4!',
    goal: 'Submit an order for exactly 4 pumpkin pies.',
    method: 'POST',
    endpoint: '/api/orders',
    body: JSON.stringify(
      { item: 'pumpkin pie', quantity: 400 },
      null,
      2,
    ),
    reference: 'POST /api/orders',
    referenceDescription:
      'Send JSON with item and quantity. Maximum quantity: 10.',
    hint: 'Keep the item as “pumpkin pie” and change quantity to the number needed.',
    mascot: '🥧',
    celebration: 'Four pies. One very relieved baker.',
  },
  {
    title: 'Access Denied',
    description:
      'The delivery team needs the manifest, but the API won’t let them in.',
    goal: 'Retrieve the delivery manifest using the demo access token.',
    method: 'GET',
    endpoint: '/api/delivery-manifest',
    body: '',
    reference: 'GET /api/delivery-manifest',
    referenceDescription:
      'Requires Authorization: Bearer feast-demo-token',
    hint:
      'Enter “Bearer feast-demo-token” in the Authorization field. Include the space!',
    mascot: '🔐',
    celebration: 'Access granted! The delivery team has its manifest.',
  },
]

function App() {
  const [authorization, setAuthorization] = useState('')
  const [missionIndex, setMissionIndex] = useState(0)
  const [method, setMethod] = useState('GET')
  const [endpoint, setEndpoint] = useState(missions[0].endpoint)
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [completed, setCompleted] = useState<number[]>(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem('api-detective-progress') ?? '[]',
      )

      if (!Array.isArray(saved)) return []

      return missions
        .map((_, index) => index)
        .filter((index) => saved.includes(index))
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(false)

  const mission = missions[missionIndex]
  const solved = completed.includes(missionIndex)

  useEffect(() => {
    try {
      localStorage.setItem(
        'api-detective-progress',
        JSON.stringify(completed),
      )
    } catch {
      // The game remains playable if browser storage is unavailable.
    }
  }, [completed])

  function loadMission(index: number) {
    const next = missions[index]
    setAuthorization('')
    setMissionIndex(index)
    setMethod(next.method)
    setEndpoint(next.endpoint)
    setRequestBody(next.body)
    setResponse(null)
    setShowHint(false)
  }

  async function sendRequest() {
    const path = endpoint.trim()

    if (!path.startsWith('/api/') || path.includes('\\')) {
      setResponse({
        status: 400,
        label: 'Invalid Request',
        body: { error: 'Enter a local path beginning with /api/' },
      })
      return
    }

    if (method === 'POST') {
      try {
        JSON.parse(requestBody)
      } catch {
        setResponse({
          status: 400,
          label: 'Invalid JSON',
          body: {
            error: 'Check your JSON before sending.',
            hint: 'Use double quotes and remove trailing commas.',
          },
        })
        return
      }
    }

    setLoading(true)

   try {
  const result = await fetch(path, {
    method,
    headers: {
      ...(method === 'POST'
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(authorization.trim()
        ? { Authorization: authorization.trim() }
        : {}),
    },
    body: method === 'POST' ? requestBody : undefined,
  })

  const body: Record<string, unknown> = await result.json()

  setResponse({
    status: result.status,
    label: result.statusText,
    body,
  })

  const turkeySolved =
    missionIndex === 0 &&
    method === 'GET' &&
    result.status === 200 &&
    body.orderId === 1042

  const piesSolved =
    missionIndex === 1 &&
    method === 'POST' &&
    result.status === 201 &&
    body.item === 'pumpkin pie' &&
    body.quantity === 4

  const manifestSolved =
    missionIndex === 2 &&
    method === 'GET' &&
    result.status === 200 &&
    body.manifestId === 'FEAST-2026' &&
    body.authorized === true

  if (turkeySolved || piesSolved || manifestSolved) {
    setCompleted((previous) =>
      previous.includes(missionIndex)
        ? previous
        : [...previous, missionIndex],
    )
  }
} catch {
  setResponse({
    status: 0,
    label: 'Connection Failed',
    body: {
      error: 'Unable to reach the API. Check that Express is running.',
    },
  })
} finally {
  setLoading(false)
}
}

  return (
      <main className="game">
        <header className="game-header">
          <a className="brand" href="#main">
            🔎 API DETECTIVE
          </a>
          <span className="theme-badge">🍂 Thanksgiving edition</span>
          <span className="score">⭐ {completed.length * 100} XP</span>
        </header>

        <section className="intro" id="main">
          <p className="eyebrow">OPERATION: SAVE THANKSGIVING</p>
          <h1>Dinner is on the line.</h1>
          <p>Find the bug. Fix the request. Save the feast.</p>
        </section>

        <nav className="mission-tabs" aria-label="Choose a mission">
          {missions.map((entry, index) => (
            <button
              key={entry.title}
              className={missionIndex === index ? 'active' : ''}
              aria-pressed={missionIndex === index}
              disabled={loading}
              onClick={() => loadMission(index)}
            >
              {completed.includes(index) ? '✓' : index + 1}
              {' · '}
              {entry.title}
            </button>
          ))}
        </nav>

        <div className="workspace">
          <section className="panel mission-panel">
            <p className="eyebrow">MISSION 0{missionIndex + 1}</p>
            <h2>{mission.title}</h2>
            <div className="mascot" aria-hidden="true">
              {mission.mascot}
            </div>
            <p>{mission.description}</p>

            <h3>Your goal</h3>
            <p>{mission.goal}</p>

            <button
              className="secondary-button"
              onClick={() => setShowHint(true)}
            >
              💡 Reveal a hint
            </button>

            {showHint && <p className="hint">{mission.hint}</p>}
          </section>

          <section className="panel request-panel">
            <p className="eyebrow">REQUEST LAB</p>
            <h2>Investigate the request</h2>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                void sendRequest()
              }}
            >
              <fieldset disabled={loading}>
                <label htmlFor="endpoint">Request URL</label>

                <div className="request-bar">
                  <select
                    className="method"
                    aria-label="HTTP method"
                    value={method}
                    onChange={(event) => setMethod(event.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>

                  <input
                    id="endpoint"
                    value={endpoint}
                    onChange={(event) => setEndpoint(event.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>

                {method === 'POST' && (
                  <div className="body-editor">
                    <label htmlFor="request-body">JSON request body</label>
                    <textarea
                      id="request-body"
                      value={requestBody}
                      onChange={(event) =>
                        setRequestBody(event.target.value)
                      }
                      spellCheck={false}
                      rows={7}
                    />
                  </div>
                )}
                <div className="body-editor">
                  <label htmlFor="authorization">Authorization header</label>
                  <input
                    className="header-input"
                    id="authorization"
                    value={authorization}
                    onChange={(event) => setAuthorization(event.target.value)}
                    placeholder="Enter a demo Bearer token"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <button className="primary-button" type="submit">
                  {loading ? 'Sending…' : 'Send Request →'}
                </button>
              </fieldset>
            </form>

            <aside className="api-reference">
              <h3>📖 API reference</h3>
              <code>{mission.reference}</code>
              <p>{mission.referenceDescription}</p>
            </aside>

            <button
              className="text-button"
              disabled={loading}
              onClick={() => loadMission(missionIndex)}
            >
              Reset request
            </button>
          </section>

          <section className="panel response-panel">
            <p className="eyebrow">RESPONSE</p>

            <div aria-live="polite" aria-busy={loading}>
              {response ? (
                <>
                  <h2
                    className={
                      response.status >= 200 && response.status < 300
                        ? 'success'
                        : 'error'
                    }
                  >
                    {response.status || 'Network error'} {response.label}
                  </h2>
                  <pre>{JSON.stringify(response.body, null, 2)}</pre>
                </>
              ) : (
                <p className="response-placeholder">
                  Send a request to investigate the response.
                </p>
              )}

              <div className="delivery-status">
                <span aria-hidden="true">
                  {solved ? '🎉 🚚 🏠' : `${mission.mascot} 📦`}
                </span>
                <h3>{solved ? mission.celebration : 'Awaiting your fix'}</h3>
                <p>
                  {solved
                    ? 'Mission complete! 100 XP earned.'
                    : mission.goal}
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer>
          Demo sandbox · No real orders · Progress saved in this browser
        </footer>
      </main>
    )
  }

  export default App