const stats = [
  { value: '12.400', suffix: '+', label: 'alunos ativos' },
  { value: '180', suffix: '', label: 'problemas' },
  { value: '32', suffix: '', label: 'badges' },
  { value: '4,9', suffix: '/5', label: 'satisfação' },
];

function Stats() {
  return (
    <section className="container">
      <div className="stats">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <strong>
              {stat.value}
              <span className="accent-text">{stat.suffix}</span>
            </strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stats;
