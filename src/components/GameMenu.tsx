import { useRef, useState, type ChangeEvent } from 'react'
import { RESET_CONFIRMATION, createSaveFile, parseSaveFile, type SaveSummary } from '../game/save'
import { LANGUAGES } from '../i18n/languages'
import { useTranslation } from '../i18n/useTranslation'
import { ACHIEVEMENT_DETAILS, useGameStore } from '../store/gameStore'

export function GameMenu() {
  const game = useGameStore()
  const { t, formatNumber, formatDuration } = useTranslation()
  const fileInput = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<SaveSummary | null>(null)
  const [importData, setImportData] = useState<ReturnType<typeof parseSaveFile> | null>(null)
  const [importError, setImportError] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetText, setResetText] = useState('')

  if (!game.showMenu) return null

  const totalStructures = Object.values(game.buildings).reduce((sum, amount) => sum + amount, 0)

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = parseSaveFile(String(reader.result ?? ''))
      if (!result.ok) {
        setImportError(true)
        setImportPreview(null)
        setImportData(null)
        return
      }
      setImportError(false)
      setImportPreview(result.summary)
      setImportData(result)
    }
    reader.readAsText(file)
  }

  const exportSave = () => {
    const blob = new Blob([createSaveFile(game.getPersistedSnapshot())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'dog-clicker-save.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="return-overlay menu-overlay">
      <section className="menu-modal" role="dialog" aria-modal="true" aria-labelledby="menu-title">
        <button className="modal-close" type="button" aria-label={t('menu.close')} onClick={() => game.setMenu(false)}>×</button>
        <div className="menu-tabs">
          <button type="button" className={game.menuTab === 'stats' ? 'active' : ''} onClick={() => game.setMenu(true, 'stats')}>
            {t('menu.stats')}
          </button>
          <button type="button" className={game.menuTab === 'options' ? 'active' : ''} onClick={() => game.setMenu(true, 'options')}>
            {t('menu.options')}
          </button>
        </div>

        {game.menuTab === 'stats' ? (
          <div className="menu-body">
            <h2 id="menu-title">{t('stats.current')}</h2>
            <div className="stats-grid">
              <div><small>{t('stats.playTime')}</small><strong>{formatDuration(game.playTimeSeconds)}</strong></div>
              <div><small>{t('stats.clicks')}</small><strong>{formatNumber(game.totalClicks)}</strong></div>
              <div><small>{t('stats.runCuddles')}</small><strong>{formatNumber(game.totalCuddles)}</strong></div>
              <div><small>{t('stats.allTimeCuddles')}</small><strong>{formatNumber(game.allTimeCuddles)}</strong></div>
              <div><small>{t('stats.bones')}</small><strong>{formatNumber(game.bonesCollected)}</strong></div>
              <div><small>{t('stats.structures')}</small><strong>{formatNumber(totalStructures)}</strong></div>
              <div><small>{t('stats.upgrades')}</small><strong>{formatNumber(game.upgrades.length)}</strong></div>
              <div><small>{t('stats.stars')}</small><strong>{formatNumber(game.prestigeStars)}</strong></div>
            </div>
            <h3>{t('stats.records')}</h3>
            <div className="stats-grid">
              <div><small>{t('stats.recordCps')}</small><strong>{formatNumber(game.recordCps)}</strong></div>
              <div><small>{t('stats.recordBalance')}</small><strong>{formatNumber(game.recordBalance)}</strong></div>
              <div><small>{t('stats.recordOffline')}</small><strong>{formatNumber(game.recordOffline)}</strong></div>
              <div><small>{t('top.achievements')}</small><strong>{game.achievements.length}/{ACHIEVEMENT_DETAILS.length}</strong></div>
            </div>
          </div>
        ) : (
          <div className="menu-body">
            <h2 id="menu-title">{t('menu.options')}</h2>
            <label className="option-row">
              <span>{t('options.language')}</span>
              <select value={game.language} onChange={(event) => game.setLanguage(event.target.value as typeof game.language)}>
                {LANGUAGES.map((language) => (
                  <option key={language.id} value={language.id}>{language.nativeName}</option>
                ))}
              </select>
            </label>
            <label className="option-row">
              <span>{t('options.animations')}</span>
              <button type="button" className={`toggle ${game.animationsEnabled ? 'on' : ''}`} onClick={() => game.setAnimationsEnabled(!game.animationsEnabled)}>
                {game.animationsEnabled ? t('options.on') : t('options.off')}
              </button>
            </label>
            <label className="option-row">
              <span>{t('options.abbreviated')}</span>
              <button type="button" className={`toggle ${game.abbreviatedNumbers ? 'on' : ''}`} onClick={() => game.setAbbreviatedNumbers(!game.abbreviatedNumbers)}>
                {game.abbreviatedNumbers ? t('options.on') : t('options.off')}
              </button>
            </label>
            <div className="option-row volume-row">
              <span>{t('options.volume')}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={game.muted ? 0 : game.volume}
                onChange={(event) => {
                  const volume = Number(event.target.value)
                  game.setVolume(volume)
                  if (volume > 0 && game.muted) game.setMuted(false)
                }}
              />
              <button type="button" className={`toggle ${game.muted ? '' : 'on'}`} onClick={() => game.setMuted(!game.muted)}>
                {game.muted ? t('options.mute') : t('options.unmute')}
              </button>
            </div>
            <p className="audio-hint">{t('options.audioHint')}</p>

            <h3>{t('options.save')}</h3>
            <div className="save-actions">
              <button type="button" onClick={exportSave}>{t('options.export')}</button>
              <button type="button" onClick={() => fileInput.current?.click()}>{t('options.import')}</button>
              <button type="button" onClick={() => game.startTutorial()}>{t('options.replayTutorial')}</button>
              <button type="button" className="danger" onClick={() => { setResetOpen(true); setResetText('') }}>{t('options.reset')}</button>
            </div>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleFile} />
            {importError && <p className="save-error">{t('save.importError')}</p>}
          </div>
        )}
      </section>

      {importPreview && importData?.ok && (
        <section className="confirm-card" role="alertdialog" aria-modal="true">
          <h3>{t('save.importTitle')}</h3>
          <p>{t('save.importBody', {
            name: importPreview.dogName,
            cuddles: formatNumber(importPreview.allTimeCuddles),
            stars: importPreview.prestigeStars,
          })}</p>
          <div className="confirm-actions">
            <button type="button" onClick={() => { setImportPreview(null); setImportData(null) }}>{t('save.importCancel')}</button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                if (importData.ok) game.importSave(importData.data)
                setImportPreview(null)
                setImportData(null)
                game.setMenu(false)
              }}
            >
              {t('save.importConfirm')}
            </button>
          </div>
        </section>
      )}

      {resetOpen && (
        <section className="confirm-card" role="alertdialog" aria-modal="true">
          <h3>{t('save.resetTitle')}</h3>
          <p>{t('save.resetBody')}</p>
          <input
            value={resetText}
            onChange={(event) => setResetText(event.target.value)}
            placeholder={t('save.resetPlaceholder')}
            autoFocus
          />
          <div className="confirm-actions">
            <button type="button" onClick={() => setResetOpen(false)}>{t('save.resetCancel')}</button>
            <button
              type="button"
              className="danger"
              disabled={resetText !== RESET_CONFIRMATION}
              onClick={() => {
                game.resetSave()
                setResetOpen(false)
                game.setMenu(false)
              }}
            >
              {t('save.resetConfirm')}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
