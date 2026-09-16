import { useTranslation } from '../i18n/useTranslation'
import { useGameStore } from '../store/gameStore'

const STEPS = [
  { title: 'tutorial.step1.title', body: 'tutorial.step1.body', target: 'dog' },
  { title: 'tutorial.step2.title', body: 'tutorial.step2.body', target: 'store' },
  { title: 'tutorial.step3.title', body: 'tutorial.step3.body', target: 'upgrades' },
] as const

export function Tutorial() {
  const game = useGameStore()
  const { t } = useTranslation()

  if (!game.hydrated || !game.tutorialOpen || game.showReturnModal || game.showMenu || game.showPrestigeModal) return null

  const step = STEPS[Math.min(game.tutorialStep, STEPS.length - 1)]
  const isLast = game.tutorialStep >= STEPS.length - 1

  return (
    <div className={`tutorial-overlay highlight-${step.target}`}>
      <section className="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <small>{game.tutorialStep + 1} / {STEPS.length}</small>
        <h2 id="tutorial-title">{t(step.title)}</h2>
        <p>{t(step.body)}</p>
        <div className="tutorial-actions">
          <button type="button" className="ghost" onClick={game.skipTutorial}>{t('tutorial.skip')}</button>
          {game.tutorialStep > 0 && (
            <button type="button" onClick={() => game.setTutorialStep(game.tutorialStep - 1)}>{t('tutorial.back')}</button>
          )}
          <button
            type="button"
            className="primary"
            onClick={() => {
              if (isLast) game.completeTutorial()
              else game.setTutorialStep(game.tutorialStep + 1)
            }}
          >
            {isLast ? t('tutorial.done') : t('tutorial.next')}
          </button>
        </div>
      </section>
    </div>
  )
}
