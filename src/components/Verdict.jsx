/**
 * Etiqueta do resultado, com a parte que o aluno mais quer saber: quanto valia
 * o acerto e o que ele levou.
 *
 * `scoring` vem do /api/execute. Num acerto, `pointsAwarded` é o valor real
 * creditado; num erro, `rewardIfAccepted` é o que ainda resta para ganhar.
 */
export function Verdict({ verdict, label, scoring }) {
  return (
    <span className="verdict-wrap">
      <span className="verdict" data-verdict={verdict}>
        {label ?? verdict}
      </span>
      {scoring ? <ScoringNote scoring={scoring} /> : null}
    </span>
  );
}

function ScoringNote({ scoring }) {
  const { pointsAwarded, rewardIfAccepted, penaltyPending, basePoints, wrongAttempts } = scoring;

  if (pointsAwarded > 0) {
    const reduced = penaltyPending > 0 || pointsAwarded < basePoints;
    return (
      <span className="verdict-score" data-kind="won">
        <strong>+{pointsAwarded}</strong> pts
        {reduced ? <em>de {basePoints}</em> : null}
      </span>
    );
  }

  if (wrongAttempts > 0) {
    return (
      <span className="verdict-score" data-kind="risk">
        vale <strong>{rewardIfAccepted}</strong> pts
        {penaltyPending > 0 ? <em>−{penaltyPending} por {wrongAttempts} erro(s)</em> : null}
      </span>
    );
  }

  return null;
}

export default Verdict;
