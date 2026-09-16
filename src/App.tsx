import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { BUILDINGS, NEWS, UPGRADES, formatNumber, getBuildingCost, getBuildingSellValue } from './game/data'
import {
  PRESTIGE_MIN_RUN_CUDDLES,
  PRESTIGE_UPGRADES,
  getPrestigeUpgradeCost,
} from './game/prestige'
import {
  ACHIEVEMENT_DETAILS,
  getClaimablePrestigeStars,
  getClickPower,
  getCps,
  useGameStore,
} from './store/gameStore'
import './App.css'

const formatOfflineTime = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${Math.max(1, minutes)} min`
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

function App() {
  const game = useGameStore()
  const [newsIndex, setNewsIndex] = useState(0)
  const [floaters, setFloaters] = useState<{ id: number; value: number; x: number; y: number }[]>([])
  const [confirmingPrestige, setConfirmingPrestige] = useState(false)
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
  const claimablePrestigeStars = getClaimablePrestigeStars(game)
  const visibleUpgrades = UPGRADES
    .filter((upgrade) => {
      const hasEnoughGenerators =
        !upgrade.requiredOwned ||
        (upgrade.buildingId !== undefined && game.buildings[upgrade.buildingId] >= upgrade.requiredOwned)
      return (
        game.totalCuddles >= upgrade.unlockAt &&
        hasEnoughGenerators &&
        !game.upgrades.includes(upgrade.id)
      )
    })
    .sort((first, second) => first.price - second.price)
  const totalDogs = Object.values(game.buildings).reduce((sum, amount) => sum + amount, 0)

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
          <button
            className="prestige-nav"
            type="button"
            onClick={() => {
              setConfirmingPrestige(false)
              game.setPrestigeModal(true)
            }}
          >
            ✨ Eredità <b>{game.availablePrestigeStars}</b>
            {claimablePrestigeStars > 0 && <em>+{claimablePrestigeStars}</em>}
          </button>
        </div>
      </header>

      <section className="game-grid">
        <aside className="dog-panel panel">
          <div className="counter-card">
            <span className="eyebrow">IL TUO PRIMO CAGNETTO</span>
            <label className="dog-name-input">
              <input
                type="text"
                value={game.dogName}
                maxLength={18}
                aria-label="Nome del tuo cagnetto"
                onChange={(event) => game.setDogName(event.target.value)}
                onBlur={() => {
                  if (!game.dogName.trim()) game.setDogName('Biscotto')
                }}
              />
              <span>✎</span>
            </label>
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
              <span className="dog-name">{game.dogName.trim() || 'Cagnetto'}</span>
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

          <div className="production-world">
            <div className="production-title">
              <div><span>IL TUO IMPERO</span><strong>Produzione di coccole</strong></div>
              <small>{totalDogs} strutture</small>
            </div>
            {totalDogs === 0 && (
              <div className="production-empty">
                <span>🐾</span>
                <strong>Il tuo impero aspetta il primo aiutante</strong>
                <small>Acquista una struttura nel negozio per far apparire la sua riga.</small>
              </div>
            )}
            {BUILDINGS.filter((building) => game.buildings[building.id] > 0).map((building) => {
              const owned = game.buildings[building.id]
              const visibleActors = Math.min(owned, 24)
              return (
                <div className={`production-row row-${building.id}`} key={building.id}>
                  <div className="production-label">
                    <span className="production-icon">{building.emoji}</span>
                    <span>
                      <strong>{building.name}</strong>
                      <small>{formatNumber(building.cps * owned)} coccole/s</small>
                    </span>
                  </div>
                  <div className="production-actors">
                    {Array.from({ length: visibleActors }, (_, index) => (
                      <span
                        className="production-actor"
                        key={index}
                        style={{ animationDelay: `${(index % 6) * 0.13}s` }}
                      >
                        {building.emoji}
                      </span>
                    ))}
                    {owned > visibleActors && <b className="actors-overflow">+{owned - visibleActors}</b>}
                  </div>
                  <strong className="production-count">{owned}</strong>
                </div>
              )
            })}
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
              {visibleUpgrades.length ? visibleUpgrades.map((upgrade) => (
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
              const unlocked = game.totalCuddles >= building.unlockAt
              if (!unlocked) {
                return (
                  <div className="building building-locked" key={building.id}>
                    <span className="building-icon">?</span>
                    <span className="building-info">
                      <strong>Struttura da scoprire</strong>
                      <small>Accumula coccole totali per rivelarla.</small>
                      <em>{formatNumber(game.totalCuddles)} / {formatNumber(building.unlockAt)} 🤎</em>
                    </span>
                    <span className="lock-mark">🔒</span>
                  </div>
                )
              }

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

      {game.showReturnModal && (
        <div className="return-overlay">
          <section
            className="return-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-title"
          >
            <div className="return-rays"><span>🐶</span></div>
            <span className="eyebrow">IL BRANCO TI ASPETTAVA</span>
            <h2 id="return-title">Che bello rivederti!</h2>
            <p>
              Mentre eri via, <strong>{game.dogName.trim() || 'il tuo cagnetto'}</strong> e il suo
              branco hanno continuato a raccogliere coccole.
            </p>
            <div className="return-summary">
              <div><small>Tempo trascorso</small><strong>{formatOfflineTime(game.offlineSeconds)}</strong></div>
              <div><small>Coccole guadagnate</small><strong>+{formatNumber(game.offlineEarnings)} 🤎</strong></div>
            </div>
            <button type="button" autoFocus onClick={game.dismissReturnModal}>
              Raccogli e continua
            </button>
            <small className="offline-cap-note">
              Produzione offline conteggiata fino a un massimo di{' '}
              {8 + game.prestigeUpgrades.productiveSleep * 2} ore.
            </small>
          </section>
        </div>
      )}

      {game.showPrestigeModal && (
        <div className="return-overlay prestige-overlay">
          <section
            className="prestige-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prestige-title"
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Chiudi"
              onClick={() => {
                setConfirmingPrestige(false)
                game.setPrestigeModal(false)
              }}
            >
              ×
            </button>

            <div className="prestige-hero">
              <span>✨</span>
              <div>
                <small>EREDITÀ DEL BRANCO</small>
                <h2 id="prestige-title">Stelle canine</h2>
                <p>Ogni stella raccolta aumenta per sempre la produzione globale dell’1%.</p>
              </div>
              <strong>{game.availablePrestigeStars}<small> disponibili</small></strong>
            </div>

            <div className="prestige-stats">
              <div><small>Stelle raccolte</small><strong>{game.prestigeStars}</strong></div>
              <div><small>Bonus permanente</small><strong>+{game.prestigeStars}%</strong></div>
              <div><small>Prossima eredità</small><strong>+{claimablePrestigeStars}</strong></div>
            </div>

            <div className="legacy-heading">
              <div><span>ALBERO DEL BRANCO</span><strong>Potenziamenti permanenti</strong></div>
              <small>Le stelle spese mantengono il loro bonus dell’1%.</small>
            </div>

            <div className="prestige-grid">
              {PRESTIGE_UPGRADES.map((upgrade) => {
                const level = game.prestigeUpgrades[upgrade.id]
                const cost = getPrestigeUpgradeCost(upgrade, level)
                const maxed = level >= upgrade.maxLevel
                return (
                  <article className="prestige-upgrade" key={upgrade.id}>
                    <span>{upgrade.emoji}</span>
                    <div>
                      <strong>{upgrade.name}</strong>
                      <small>{upgrade.description}</small>
                      <em>Livello {level}/{upgrade.maxLevel}</em>
                    </div>
                    <button
                      type="button"
                      disabled={maxed || game.availablePrestigeStars < cost}
                      onClick={() => game.buyPrestigeUpgrade(upgrade.id)}
                    >
                      {maxed ? 'MAX' : `${cost} ✨`}
                    </button>
                  </article>
                )
              })}
            </div>

            <div className="ascension-box">
              {claimablePrestigeStars > 0 ? (
                <>
                  <div>
                    <small>RICOMINCIA IL VIAGGIO</small>
                    <strong>Otterrai {claimablePrestigeStars} Stelle canine</strong>
                    <p>Strutture, coccole e upgrade normali verranno azzerati.</p>
                  </div>
                  <button
                    type="button"
                    className={confirmingPrestige ? 'is-confirming' : ''}
                    onClick={() => {
                      if (confirmingPrestige) {
                        game.ascend()
                        setConfirmingPrestige(false)
                      } else {
                        setConfirmingPrestige(true)
                      }
                    }}
                  >
                    {confirmingPrestige ? 'Conferma il reset' : 'Inizia una nuova eredità'}
                  </button>
                </>
              ) : (
                <div className="prestige-locked">
                  <span>🔒</span>
                  <div>
                    <strong>L’eredità non è ancora pronta</strong>
                    <p>
                      Accumula almeno {formatNumber(PRESTIGE_MIN_RUN_CUDDLES)} coccole in questa
                      partita e continua a far crescere il branco.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {game.goldenBoneVisible && (
        <button
          className="golden-bone"
          type="button"
          onClick={game.collectGoldenBone}
          aria-label="Raccogli l’osso d’oro"
          style={{
            '--bone-x': `${game.goldenBoneX}vw`,
            '--bone-y': `${game.goldenBoneY}vh`,
            '--bone-size': `${game.goldenBoneSize}px`,
            '--bone-edge': `${game.goldenBoneSize / 2 + 12}px`,
          } as CSSProperties}
        >
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
