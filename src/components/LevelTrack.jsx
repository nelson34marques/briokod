import { useEffect, useMemo, useState } from 'react';
import { getModulesWithLevels } from '../lib/tracks.js';
import { getModuleIcon, IconCheck, IconLock } from './Icons.jsx';

/** Quantos níveis já foram vencidos em sequência, a partir do primeiro. */
function unlockedCount(levels, completed) {
  let count = 0;
  for (const level of levels) {
    if (completed.includes(level.id)) count += 1;
    else break;
  }
  return count;
}

export function LevelTrack({
  track,
  currentLevelId,
  completedLevelIds = [],
  onSelect,
  variant = 'practice',
}) {
  const modules = useMemo(() => getModulesWithLevels(track), [track]);
  const unlocked = unlockedCount(track.levels, completedLevelIds);

  // Módulo ao qual o nível atual pertence
  const activeModuleOfCurrentLevel = useMemo(() => {
    return modules.find((m) => m.levels.some((l) => l.id === currentLevelId)) || modules[0];
  }, [modules, currentLevelId]);

  // Permite ao aluno navegar entre módulos na barra lateral, sincronizando com o nível atual
  const [selectedModuleId, setSelectedModuleId] = useState(activeModuleOfCurrentLevel?.id ?? 'm1');

  useEffect(() => {
    if (activeModuleOfCurrentLevel?.id) {
      setSelectedModuleId(activeModuleOfCurrentLevel.id);
    }
  }, [activeModuleOfCurrentLevel?.id]);

  const displayedModule = useMemo(() => {
    return modules.find((m) => m.id === selectedModuleId) || activeModuleOfCurrentLevel || modules[0];
  }, [modules, selectedModuleId, activeModuleOfCurrentLevel]);

  if (!displayedModule) return null;

  const doneInModule = displayedModule.levels.filter((l) => completedLevelIds.includes(l.id)).length;
  const isModuleComplete = doneInModule === displayedModule.levels.length;

  return (
    <div className={`level-track is-${variant}`}>
      <header className="level-track-head">
        <span>Módulo {displayedModule.number}</span>
        <span className="count">
          {doneInModule}/{displayedModule.levels.length} feitos
        </span>
      </header>

      <div className="track-module-group single-module">
        <div className={`module-group-header${isModuleComplete ? ' is-complete' : ''}`}>
          <div className="group-title-wrap">
            <span className="group-icon">{getModuleIcon(displayedModule.id, 18)}</span>
            <div>
              <span className="group-badge">Módulo {displayedModule.number}</span>
              <h4 className="group-title">{displayedModule.title}</h4>
            </div>
          </div>
          <span className="group-count">
            {doneInModule}/{displayedModule.levels.length}
          </span>
        </div>

        <ol className="level-list">
          {displayedModule.levels.map((level) => {
            const globalIndex = track.levels.findIndex((l) => l.id === level.id);
            const done = completedLevelIds.includes(level.id);
            const isCurrent = level.id === currentLevelId;
            const locked = globalIndex > unlocked;

            return (
              <li key={level.id}>
                <button
                  type="button"
                  className={`level-step${done ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}${
                    locked ? ' is-locked' : ''
                  }`}
                  onClick={() => !locked && onSelect(level)}
                  disabled={locked}
                >
                  <span className="marker">
                    {done ? <IconCheck size={14} /> : locked ? <IconLock size={12} /> : String(level.order || globalIndex + 1).padStart(2, '0')}
                  </span>

                  <span className="content">
                    <span className="name">{level.title}</span>
                    <span className="goal">{level.goal}</span>
                  </span>

                  {isCurrent ? <span className="here">agora</span> : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default LevelTrack;

