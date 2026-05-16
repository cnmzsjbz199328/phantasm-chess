import type { SceneMeta } from '../types/SceneMeta';

interface Props {
  meta: SceneMeta;
  onClose: () => void;
}

export function OutroOverlay({ meta, onClose }: Props) {
  return (
    <div className="outro-overlay" onClick={onClose}>
      <div className="outro-track">
        <div className="outro-title">{meta.title}</div>
        {meta.subtitle && <div className="outro-subtitle">{meta.subtitle}</div>}

        {meta.cast.length > 0 && (
          <section className="outro-section">
            <div className="outro-section-label">Players</div>
            {meta.cast.map((m, i) => (
              <div key={i} className="outro-credit-row">
                <span className="outro-credit-role">{m.role}</span>
                <span className="outro-credit-name">{m.name}</span>
              </div>
            ))}
          </section>
        )}

        <section className="outro-section">
          {meta.director && (
            <div className="outro-credit-row">
              <span className="outro-credit-role">Featured</span>
              <span className="outro-credit-name">{meta.director}</span>
            </div>
          )}
          {meta.writer && (
            <div className="outro-credit-row">
              <span className="outro-credit-role">Narration</span>
              <span className="outro-credit-name">{meta.writer}</span>
            </div>
          )}
        </section>

        {meta.tools && meta.tools.length > 0 && (
          <section className="outro-section">
            <div className="outro-section-label">Built With</div>
            {meta.tools.map((tool, i) => (
              <div key={i} className="outro-tool">{tool}</div>
            ))}
          </section>
        )}

        {meta.nextEpisode && (
          <section className="outro-section outro-next">
            <div className="outro-section-label">Coming Up</div>
            <div className="outro-next-text">{meta.nextEpisode}</div>
          </section>
        )}

        <div className="outro-footer">— Phantasm Chess —</div>
      </div>
    </div>
  );
}
