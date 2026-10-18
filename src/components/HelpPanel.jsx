import { useEffect, useState } from 'react';
import { HELP } from '../data/helpContent';

// Botón "Cómo jugar" + panel lateral. Se cierra con Esc o al hacer clic fuera.
export default function HelpPanel({ game }) {
  const [open, setOpen] = useState(false);
  const content = HELP[game];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!content) return null;

  const renderList = (items) => (
    <ul>
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );

  return (
    <>
      <button type="button" className="help-btn" onClick={() => setOpen(true)}>
        <span aria-hidden="true">?</span> Cómo jugar
      </button>

      {open && (
        <div className="help-backdrop" onClick={() => setOpen(false)}>
          <aside
            className="help-panel"
            role="dialog"
            aria-modal="true"
            aria-label={content.title}
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h2>{content.title}</h2>
              <button type="button" className="help-close" onClick={() => setOpen(false)} aria-label="Cerrar ayuda">✕</button>
            </header>
            <p className="help-intro">{content.intro}</p>

            {content.sections.map((s) => (
              <section key={s.heading}>
                <h3>{s.heading}</h3>
                {renderList(s.items)}
              </section>
            ))}

            {content.table && (
              <section>
                <h3>Pagos</h3>
                <dl className="help-table">
                  {content.table.map((r) => (
                    <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>
                  ))}
                </dl>
              </section>
            )}

            {content.sideBets && (
              <section>
                <h3>{content.sideBets.heading}</h3>
                {renderList(content.sideBets.items)}
              </section>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
