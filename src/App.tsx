import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { BUILDINGS, NEWS, UPGRADES, formatNumber, getBuildingCost, getBuildingSellValue } from './game/data'
import { ACHIEVEMENT_DETAILS, getClickPower, getCps, useGameStore } from './store/gameStore'
import './App.css'

function App() {
  const game = useGameStore()
  const [newsIndex, setNewsIndex] = useState(0)
  const [floaters, setFloaters] = useState<{ id: number; value: number; x: number; y: number }[]>([])
  const floaterId = useRef(0)
  const lastTick = useRef(0)
  const tick = game.tick

  useEffect(() => {
    let frame = 0
    lastTick.current = performance.now()
    const loop = (now: number) => {
      const elapsed = now - lastTick.current
      if (elapsed >= 50) {
        tick(Math.min(elapsed / 1_000, 1))
        lastTick.current = now
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [tick])

  useEffect(() => {
    const interval = window.setInterval(() => setNewsIndex((index) => (index + 1) % NEWS.length), 8_000)
    return () => window.clearInterval(interval)
  }, [])

  const cps = getCps(game)
  const clickPower = getClickPower(game)
  const visibleUpgrades = UPGRADES.filter(
    (upgrade) => game.totalCuddles >= upgrade.unlockAt && !game.upgrades.includes(upgrade.id),
  )
  const totalDogs = Object.values(game.buildings).reduce((sum, amount) => sum + amount, 0)
  const kennelDogs = useMemo(() => {
    const count = Math.min(28, Math.max(4, totalDogs))
    return Array.from({ length: count }, (_, index) => ['🐕', '🐩', '🦮', '🐕‍🦺'][index % 4])
  }, [totalDogs])

  const handleDogClick = (event: MouseEvent<HTMLButtonElement>) => {
    const gained = game.clickDog()
    const id = ++floaterId.current
    setFloaters((items) => [...items, { id, value: gained, x: event.clientX, y: event.clientY }])
    window.setTimeout(() => setFloaters((items) => items.filter((item) => item.id !== id)), 900)
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🐾</span>
          <div><strong>Dog Clicker</strong><small>L’impero delle coccole</small></div>
        </div>
        <div className="top-stats">
          <span><b>{formatNumber(game.totalClicks)}</b> click</span>
          <span><b>{game.achievements.length}/{ACHIEVEMENT_DETAILS.length}</b> traguardi</span>
          <span className="saved">Salvataggio automatico</span>
        </div>
      </header>

      <section className="game-grid">
        <aside className="dog-panel panel">
          <div className="counter-card">
            <span className="eyebrow">LA TUA RISERVA</span>
            <h1>{formatNumber(game.cuddles)}</h1>
            <p>coccole</p>
            <div className="cps-pill"><span className="live-dot" /> {formatNumber(cps)} al secondo</div>
          </div>

          <div className="dog-stage">
            <div className="sun-glow" />
            <span className="cloud cloud-one">☁️</span>
            <span className="cloud cloud-two">☁️</span>
            <button className="dog-button" type="button" onClick={handleDogClick} aria-label="Coccola il cagnetto">
              <span className="dog-shadow" />
              <span className="dog-emoji">🐶</span>
              <span className="dog-name">Biscotto</span>
            </button>
            <p className="click-hint">Clicca per una coccola <span>+{formatNumber(clickPower)}</span></p>
          </div>

          <div className="active-effects">
            {game.currentTime < game.frenzyUntil && <span>⚡ Frenesia ×7</span>}
            {game.currentTime < game.clickFrenzyUntil && <span>🐾 Click ×25</span>}
          </div>
        </aside>

        <section className="world-panel panel">
          <div className="news-ticker">
            <span>NOTIZIE DAL PARCO</span>
            <p>{NEWS[newsIndex]}</p>
          </div>

          <div className="world-scene">
            <div className="scene-sky">
              <div className="scene-title">
                <span>IL TUO BRANCO</span>
                <strong>{totalDogs} aiutanti</strong>
              </div>
              <div className="hills hills-back" />
              <div className="hills hills-front" />
            </div>
            <div className="kennel">
              {kennelDogs.map((dog, index) => (
                <span key={index} style={{ animationDelay: `${(index % 5) * 0.18}s` }}>{dog}</span>
              ))}
            </div>
            <div className="village">
              <span>🏠</span><span>🌲</span><span>🏡</span><span>🌳</span><span>🏠</span>
            </div>
          </div>

          <div className="message-bar"><span>💬</span><p>{game.message}</p></div>

          <div className="achievements">
            <div className="section-heading">
              <div><span>TRAGUARDI</span><strong>Collezione del branco</strong></div>
              <small>{game.achievements.length} sbloccati</small>
            </div>
            <div className="achievement-grid">
              {ACHIEVEMENT_DETAILS.map((achievement) => {
                const earned = game.achievements.includes(achievement.id)
                return (
                  <div className={`achievement ${earned ? 'earned' : ''}`} key={achievement.id} title={achievement.name}>
                    <span>{earned ? achievement.emoji : '🔒'}</span>
                    <small>{earned ? achievement.name : 'Da scoprire'}</small>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="store-panel panel">
          <div className="store-header">
            <div><span className="eyebrow">BOUTIQUE</span><h2>Negozio</h2></div>
            <span className="wallet">🤎 {formatNumber(game.cuddles)}</span>
          </div>

          <div className="upgrades">
            <div className="section-heading compact">
              <strong>Upgrade</strong><small>{game.upgrades.length} posseduti</small>
            </div>
            <div className="upgrade-row">
              {visibleUpgrades.length ? visibleUpgrades.slice(0, 5).map((upgrade) => (
                <button
                  type="button"
                  key={upgrade.id}
                  className="upgrade-button"
                  disabled={game.cuddles < upgrade.price}
                  onClick={() => game.buyUpgrade(upgrade.id)}
                  title={`${upgrade.name}: ${upgrade.description}`}
                >
                  <span>{upgrade.emoji}</span><small>{formatNumber(upgrade.price)}</small>
                </button>
              )) : <p className="no-upgrades">Continua a coccolare per sbloccare nuovi upgrade.</p>}
            </div>
          </div>

          <div className="store-controls">
            <div className="segment">
              <button type="button" className={game.purchaseMode === 'buy' ? 'active' : ''} onClick={() => game.setPurchaseMode('buy')}>Compra</button>
              <button type="button" className={game.purchaseMode === 'sell' ? 'active' : ''} onClick={() => game.setPurchaseMode('sell')}>Vendi</button>
            </div>
            <div className="segment amount">
              {([1, 10, 100] as const).map((amount) => (
                <button type="button" key={amount} className={game.buyAmount === amount ? 'active' : ''} onClick={() => game.setBuyAmount(amount)}>×{amount}</button>
              ))}
            </div>
          </div>

          <div className="building-list">
            {BUILDINGS.map((building) => {
              const owned = game.buildings[building.id]
              const value = game.purchaseMode === 'buy'
                ? getBuildingCost(building, owned, game.buyAmount)
                : getBuildingSellValue(building, owned, game.buyAmount)
              const disabled = game.purchaseMode === 'buy' ? game.cuddles < value : owned === 0
              return (
                <button
                  type="button"
                  className="building"
                  key={building.id}
                  disabled={disabled}
                  onClick={() => game.buyBuilding(building.id)}
                >
                  <span className="building-icon">{building.emoji}</span>
                  <span className="building-info">
                    <strong>{building.name}</strong>
                    <small>{building.description}</small>
                    <em>{game.purchaseMode === 'sell' ? 'Ricavo' : 'Costo'}: {formatNumber(value)} 🤎</em>
                  </span>
                  <span className="building-owned">{owned}</span>
                </button>
              )
            })}
          </div>
        </aside>
      </section>

      {game.goldenBoneVisible && (
        <button className="golden-bone" type="button" onClick={game.collectGoldenBone} aria-label="Raccogli l’osso d’oro">
          <span>🦴</span><small>PRENDIMI!</small>
        </button>
      )}

      {floaters.map((floater) => (
        <span className="floater" key={floater.id} style={{ left: floater.x, top: floater.y }}>
          +{formatNumber(floater.value)} 🤎
        </span>
      ))}
    </main>
  )
}

export default App
