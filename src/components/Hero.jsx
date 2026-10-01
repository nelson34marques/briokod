const k = (text) => <span className="k">{text}</span>;
const f = (text) => <span className="f">{text}</span>;
const s = (text) => <span className="s">{text}</span>;
const n = (text) => <span className="n">{text}</span>;
const c = (text) => <span className="c">{text}</span>;

const code = [
  <>{k('def')} {f('fizzbuzz')}(n):</>,
  <>    {c('# cada número, uma linha')}</>,
  <>    linhas = []</>,
  <>
    {'    '}
    {k('for')} i {k('in')} {f('range')}({n('1')}, n + {n('1')}):
  </>,
  <>
    {'        '}
    {k('if')} i % {n('15')} == {n('0')}:
  </>,
  <>
    {'            '}
    linhas.append({s('"FizzBuzz"')})
  </>,
  <>
    {'        '}
    {k('elif')} i % {n('3')} == {n('0')}:
  </>,
  <>
    {'            '}
    linhas.append({s('"Fizz"')})
  </>,
  <>
    {'        '}
    {k('elif')} i % {n('5')} == {n('0')}:
  </>,
  <>
    {'            '}
    linhas.append({s('"Buzz"')})
  </>,
  <>
    {'        '}
    {k('else')}:
  </>,
  <>
    {'            '}
    linhas.append({f('str')}(i))
  </>,
  <>{k('print')}({f('fizzbuzz')}({n('15')}))</>,
];

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="kicker">
            <b>01</b> Plataforma
          </span>

          <h1 className="hero-title">
            Lógica de programação <span className="accent-text">combinada com execução real</span>
          </h1>

          <p className="hero-sub">
            Trilha do zero a algoritmos avançados. Cada submissão roda num sandbox isolado, com tempo
            e memória limitados, e vira veredito instantâneo.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => scrollToSection('trilha')}>
              Começar agora
            </button>
            <button className="btn btn-outline" onClick={() => scrollToSection('desafios')}>
              Ver problemas
            </button>
          </div>

          <p className="hero-note">
            <span className="dot" />
            judge0-ce + pistão · failover automático
          </p>
        </div>

        <div className="code-card" aria-hidden="true">
          <div className="code-bar">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
            <span className="file">solucao.py</span>
            <span className="badge">aceito</span>
          </div>

          <div className="code-body">
            {code.map((line, index) => (
              <div
                className="code-line"
                key={index}
              >
                <span className="no">{index + 1}</span>
                <span className="src">{line}</span>
              </div>
            ))}
          </div>

          <div className="code-foot">
            <span className="chip">python 3.12</span>
            <span className="chip">0,011 s</span>
            <span className="chip">3,6 MB</span>
            <span className="chip">12 / 12 testes</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
