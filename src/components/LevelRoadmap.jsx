import React, { useMemo } from 'react';
import { getModulesWithLevels } from '../lib/tracks.js';
import { getModuleIcon, IconCheck, IconLock, IconTerminal } from './Icons.jsx';

/**
 * Posições em zigue-zague estilo Duolingo para os nós de exercício.
 * O offset em porcentagem / pixels cria a sensação de estrada sinuosa.
 */
const ZIG_ZAG_OFFSETS = [0, -42, -20, 38, 18, -35, 35, 0];

function getUnlockedCount(levels, completedIds = []) {
  let count = 0;
  for (const level of levels) {
    if (completedIds.includes(level.id)) count += 1;
    else break;
  }
  return count;
}

export function LevelRoadmap({
  track,
  currentLevelId,
  completedLevelIds = [],
  onSelectLevel,
}) {
  const modules = useMemo(() => getModulesWithLevels(track), [track]);
  const unlockedCount = useMemo(
    () => getUnlockedCount(track.levels, completedLevelIds),
    [track.levels, completedLevelIds]
  );

  return (
    <div className="duolingo-roadmap">
      {modules.map((module, mIdx) => {
        const moduleDoneCount = module.levels.filter((l) =>
          completedLevelIds.includes(l.id)
        ).length;
        const isModuleComplete = moduleDoneCount === module.levels.length;

        return (
          <section key={module.id} className="roadmap-module">
            {/* Banner do Módulo */}
            <div className={`module-banner${isModuleComplete ? ' is-completed' : ''}`}>
              <div className="module-banner-left">
                <span className="module-badge">
                  {getModuleIcon(module.id, 14)} Módulo {module.number || mIdx + 1}
                </span>
                <h3 className="module-title">{module.title}</h3>
                <p className="module-tagline">{module.tagline || module.goal}</p>
              </div>

              <div className="module-banner-progress">
                <span className="progress-text">
                  <strong>{moduleDoneCount}</strong> / {module.levels.length} feitos
                </span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(moduleDoneCount / module.levels.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Estrada / Caminho Sinuoso */}
            <div className="roadmap-path">
              <div className="roadmap-nodes-container">
                {module.levels.map((level, lIdx) => {
                  const globalIndex = track.levels.findIndex((l) => l.id === level.id);
                  const isDone = completedLevelIds.includes(level.id);
                  const isCurrent = level.id === currentLevelId;
                  const isLocked = globalIndex > unlockedCount;
                  const offset = ZIG_ZAG_OFFSETS[lIdx % ZIG_ZAG_OFFSETS.length];

                  return (
                    <div
                      key={level.id}
                      className="roadmap-node-wrapper"
                      style={{
                        transform: `translateX(${offset}px)`,
                      }}
                    >
                      {isCurrent ? (
                        <div className="node-floating-tag">
                          <span>COMEÇAR</span>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className={`roadmap-node${isDone ? ' is-done' : ''}${
                          isCurrent ? ' is-current' : ''
                        }${isLocked ? ' is-locked' : ''}`}
                        onClick={() => !isLocked && onSelectLevel(level)}
                        disabled={isLocked}
                        title={
                          isLocked
                            ? 'Complete os exercícios anteriores para desbloquear'
                            : level.title
                        }
                      >
                        <span className="node-inner">
                          {isDone ? (
                            <span className="node-icon"><IconCheck size={26} /></span>
                          ) : isLocked ? (
                            <span className="node-icon lock"><IconLock size={20} /></span>
                          ) : (
                            <span className="node-icon num">{level.order || globalIndex + 1}</span>
                          )}
                        </span>

                        {isDone ? <span className="node-badge"><IconTerminal size={13} color="#22d3ee" /></span> : null}
                      </button>

                      {/* Tooltip com dados do exercício */}
                      <div className="node-info-card">
                        <span className="node-info-kicker">
                          Exercício {level.order || globalIndex + 1}
                        </span>
                        <h4 className="node-info-title">{level.title}</h4>
                        <p className="node-info-goal">{level.goal}</p>
                        <div className="node-info-concepts">
                          {level.concepts?.slice(0, 2).map((c) => (
                            <span key={c} className="mini-chip">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default LevelRoadmap;
