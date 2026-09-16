import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { GameMenu } from './components/GameMenu'
import { Tutorial } from './components/Tutorial'
import { BUILDINGS, NEWS_COUNT, UPGRADES, getBuildingCost, getBuildingSellValue } from './game/data'
import {
  PRESTIGE_MIN_RUN_CUDDLES,
  PRESTIGE_UPGRADES,
  getPrestigeUpgradeCost,
} from './game/prestige'
import { getLanguageLocale } from './i18n/languages'
import { useTranslation } from './i18n/useTranslation'
import {
  ACHIEVEMENT_DETAILS,
  getClaimablePrestigeStars,
  getClickPower,
  getCps,
  useGameStore,
} from './store/gameStore'
import './App.css'

function App() {
  const game = useGameStore()
  const {
    t,
    formatNumber,
    formatDuration,
    buildingName,
    buildingDescription,
    upgradeName,
    upgradeDescription,
    resolveMessage,
  } = useTranslation()
  const [newsIndex, setNewsIndex] = useState(0)
  const [floaters, setFloaters] = useState<{ id: number; value: number; x: number; y: number }[]>([])
  const [confirmingPrestige, setConfirmingPrestige] = useState(false)
  const floaterId = useRef(0)
  const lastTick = useRef(0)
  const tick = game.tick

  useEffect(() => {
    document.documentElement.lang = getLanguageLocale(game.language)
    document.documentElement.classList.toggle('no-animations', !game.animationsEnabled)
  }, [game.language, game.animationsEnabled])

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
    const interval = window.setInterval(() => setNewsIndex((index) => (index + 1) % NEWS_COUNT), 8_000)
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
    if (!game.animationsEnabled) return
    const id = ++floaterId.current
    setFloaters((items) => [...items, { id, value: gained, x: event.clientX, y: event.clientY }])
    window.setTimeout(() => setFloaters((items) => items.filter((item) => item.id !== id)), 900)
  }

  return (
    <main className={`game-shell${game.tutorialOpen && !game.showReturnModal && !game.showMenu ? ` tutorial-step-${game.tutorialStep}` : ''}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🐾</span>
          <div><strong>{t('brand.title')}</strong><small>{t('brand.tagline')}</small></div>
        </div>
        <div className="top-stats">
          <span><b>{formatNumber(game.totalClicks)}</b> {t('top.clicks')}</span>
          <span><b>{game.achievements.length}/{ACHIEVEMENT_DETAILS.length}</b> {t('top.achievements')}</span>
          <span className="saved">{t('top.saved')}</span>
          <button
            className="prestige-nav"
            type="button"
            onClick={() => {
              setConfirmingPrestige(false)
              game.setPrestigeModal(true)
            }}
          >
            ✨ {t('top.legacy')} <b>{game.availablePrestigeStars}</b>
            {claimablePrestigeStars > 0 && <em>+{claimablePrestigeStars}</em>}
          </button>
          <button className="menu-nav" type="button" onClick={() => game.setMenu(true, 'stats')}>
            {t('top.menu')}
          </button>
        </div>
      </header>

      <section className="game-grid">
        <aside className="dog-panel panel" data-tutorial="dog">
          <div className="counter-card">
            <span className="eyebrow">{t('dog.eyebrow')}</span>
            <label className="dog-name-input">
              <input
                type="text"
                value={game.dogName}
                maxLength={18}
                aria-label={t('dog.nameAria')}
                onChange={(event) => game.setDogName(event.target.value)}
                onBlur={() => {
                  if (!game.dogName.trim()) game.setDogName(t('dog.defaultName'))
                }}
              />
              <span>✎</span>
            </label>
            <h1>{formatNumber(game.cuddles)}</h1>
            <p>{t('dog.cuddles')}</p>
            <div className="cps-pill"><span className="live-dot" /> {formatNumber(cps)} {t('dog.perSecond')}</div>
          </div>

          <div className="dog-stage">
            <div className="sun-glow" />
            <span className="cloud cloud-one">☁️</span>
            <span className="cloud cloud-two">☁️</span>
            <button className="dog-button" type="button" onClick={handleDogClick} aria-label={t('dog.patAria')}>
              <span className="dog-shadow" />
              <span className="dog-emoji">🐶</span>
              <span className="dog-name">{game.dogName.trim() || t('dog.fallbackName')}</span>
            </button>
            <p className="click-hint">{t('dog.clickHint')} <span>+{formatNumber(clickPower)}</span></p>
          </div>

          <div className="active-effects">
            {game.currentTime < game.frenzyUntil && <span>⚡ {t('effects.frenzy')}</span>}
            {game.currentTime < game.clickFrenzyUntil && <span>🐾 {t('effects.clickFrenzy')}</span>}
          </div>
        </aside>

        <section className="world-panel panel">
          <div className="news-ticker">
            <span>{t('news.label')}</span>
            <p>{t(`news.${newsIndex}` as 'news.0')}</p>
          </div>

          <div className="production-world">
            <div className="production-title">
              <div><span>{t('empire.label')}</span><strong>{t('empire.title')}</strong></div>
              <small>{totalDogs} {t('empire.structures')}</small>
            </div>
            {totalDogs === 0 && (
              <div className="production-empty">
                <span>🐾</span>
                <strong>{t('empire.emptyTitle')}</strong>
                <small>{t('empire.emptyHint')}</small>
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
                      <strong>{buildingName(building.id)}</strong>
                      <small>{formatNumber(building.cps * owned)} {t('empire.cps')}</small>
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

          <div className="message-bar"><span>💬</span><p>{resolveMessage(game.message)}</p></div>

          <div className="achievements">
            <div className="section-heading">
              <div><span>{t('achievements.label')}</span><strong>{t('achievements.title')}</strong></div>
              <small>{game.achievements.length} {t('achievements.unlocked')}</small>
            </div>
            <div className="achievement-grid">
              {ACHIEVEMENT_DETAILS.map((achievement) => {
                const earned = game.achievements.includes(achievement.id)
                const name = t(`achievement.${achievement.id}.name` as 'achievement.first-pat.name')
                return (
                  <div className={`achievement ${earned ? 'earned' : ''}`} key={achievement.id} title={earned ? name : t('achievements.hidden')}>
                    <span>{earned ? achievement.emoji : '🔒'}</span>
                    <small>{earned ? name : t('achievements.hidden')}</small>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="store-panel panel" data-tutorial="store">
          <div className="store-header">
            <div><span className="eyebrow">{t('store.boutique')}</span><h2>{t('store.title')}</h2></div>
            <span className="wallet">🤎 {formatNumber(game.cuddles)}</span>
          </div>

          <div className="upgrades" data-tutorial="upgrades">
            <div className="section-heading compact">
              <strong>{t('store.upgrades')}</strong><small>{game.upgrades.length} {t('store.owned')}</small>
            </div>
            <div className="upgrade-row">
              {visibleUpgrades.length ? visibleUpgrades.map((upgrade) => (
                <button
                  type="button"
                  key={upgrade.id}
                  className="upgrade-button"
                  disabled={game.cuddles < upgrade.price}
                  onClick={() => game.buyUpgrade(upgrade.id)}
                  title={`${upgradeName(upgrade)}: ${upgradeDescription(upgrade)}`}
                >
                  <span>{upgrade.emoji}</span><small>{formatNumber(upgrade.price)}</small>
                </button>
              )) : <p className="no-upgrades">{t('store.noUpgrades')}</p>}
            </div>
          </div>

          <div className="store-controls">
            <div className="segment">
              <button type="button" className={game.purchaseMode === 'buy' ? 'active' : ''} onClick={() => game.setPurchaseMode('buy')}>{t('store.buy')}</button>
              <button type="button" className={game.purchaseMode === 'sell' ? 'active' : ''} onClick={() => game.setPurchaseMode('sell')}>{t('store.sell')}</button>
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
                      <strong>{t('store.lockedTitle')}</strong>
                      <small>{t('store.lockedHint')}</small>
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
                    <strong>{buildingName(building.id)}</strong>
                    <small>{buildingDescription(building.id)}</small>
                    <em>{game.purchaseMode === 'sell' ? t('store.revenue') : t('store.cost')}: {formatNumber(value)} 🤎</em>
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
          <section className="return-modal" role="dialog" aria-modal="true" aria-labelledby="return-title">
            <div className="return-rays"><span>🐶</span></div>
            <span className="eyebrow">{t('return.eyebrow')}</span>
            <h2 id="return-title">{t('return.title')}</h2>
            <p>{t('return.body', { name: game.dogName.trim() || t('dog.fallbackName') })}</p>
            <div className="return-summary">
              <div><small>{t('return.time')}</small><strong>{formatDuration(game.offlineSeconds)}</strong></div>
              <div><small>{t('return.earned')}</small><strong>+{formatNumber(game.offlineEarnings)} 🤎</strong></div>
            </div>
            <button type="button" autoFocus onClick={game.dismissReturnModal}>
              {t('return.collect')}
            </button>
            <small className="offline-cap-note">
              {t('return.cap', { hours: 8 + game.prestigeUpgrades.productiveSleep * 2 })}
            </small>
          </section>
        </div>
      )}

      {game.showPrestigeModal && (
        <div className="return-overlay prestige-overlay">
          <section className="prestige-modal" role="dialog" aria-modal="true" aria-labelledby="prestige-title">
            <button
              className="modal-close"
              type="button"
              aria-label={t('prestige.close')}
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
                <small>{t('prestige.eyebrow')}</small>
                <h2 id="prestige-title">{t('prestige.title')}</h2>
                <p>{t('prestige.subtitle')}</p>
              </div>
              <strong>{game.availablePrestigeStars}<small>{t('prestige.available')}</small></strong>
            </div>

            <div className="prestige-stats">
              <div><small>{t('prestige.collected')}</small><strong>{game.prestigeStars}</strong></div>
              <div><small>{t('prestige.bonus')}</small><strong>+{game.prestigeStars}%</strong></div>
              <div><small>{t('prestige.next')}</small><strong>+{claimablePrestigeStars}</strong></div>
            </div>

            <div className="legacy-heading">
              <div><span>{t('prestige.treeEyebrow')}</span><strong>{t('prestige.treeTitle')}</strong></div>
              <small>{t('prestige.treeHint')}</small>
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
                      <strong>{t(`prestige.${upgrade.id}.name` as 'prestige.packHeart.name')}</strong>
                      <small>{t(`prestige.${upgrade.id}.description` as 'prestige.packHeart.description')}</small>
                      <em>{t('prestige.level', { level, max: upgrade.maxLevel })}</em>
                    </div>
                    <button
                      type="button"
                      disabled={maxed || game.availablePrestigeStars < cost}
                      onClick={() => game.buyPrestigeUpgrade(upgrade.id)}
                    >
                      {maxed ? t('prestige.max') : `${cost} ✨`}
                    </button>
                  </article>
                )
              })}
            </div>

            <div className="ascension-box">
              {claimablePrestigeStars > 0 ? (
                <>
                  <div>
                    <small>{t('prestige.restart')}</small>
                    <strong>{t('prestige.gain', { stars: claimablePrestigeStars })}</strong>
                    <p>{t('prestige.resetHint')}</p>
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
                    {confirmingPrestige ? t('prestige.confirm') : t('prestige.start')}
                  </button>
                </>
              ) : (
                <div className="prestige-locked">
                  <span>🔒</span>
                  <div>
                    <strong>{t('prestige.lockedTitle')}</strong>
                    <p>{t('prestige.lockedBody', { amount: formatNumber(PRESTIGE_MIN_RUN_CUDDLES) })}</p>
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
          aria-label={t('bone.aria')}
          style={{
            '--bone-x': `${game.goldenBoneX}vw`,
            '--bone-y': `${game.goldenBoneY}vh`,
            '--bone-size': `${game.goldenBoneSize}px`,
            '--bone-edge': `${game.goldenBoneSize / 2 + 12}px`,
          } as CSSProperties}
        >
          <span>🦴</span><small>{t('bone.catch')}</small>
        </button>
      )}

      {floaters.map((floater) => (
        <span className="floater" key={floater.id} style={{ left: floater.x, top: floater.y }}>
          +{formatNumber(floater.value)} 🤎
        </span>
      ))}

      <GameMenu />
      <Tutorial />
    </main>
  )
}

export default App
