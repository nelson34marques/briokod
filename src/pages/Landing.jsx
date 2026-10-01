import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import AuthDialog from '../components/AuthDialog.jsx';
import Hero from '../components/Hero.jsx';
import Stats from '../components/Stats.jsx';
import Marquee from '../components/Marquee.jsx';
import Footer from '../components/Footer.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/auth-context.js';
import { TRACK_LIST } from '../lib/tracks.js';
import '../App.css';

function scrollCarousel(ref, direction) {
  if (!ref.current) return;
  const card = ref.current.querySelector(':scope > *');
  const amount = card ? card.offsetWidth + 12 : 300;
  ref.current.scrollBy({ left: direction * amount, behavior: 'smooth' });
}

function CarouselButtons({ targetRef }) {
  return (
    <div className="carousel-nav">
      <button aria-label="Anterior" onClick={() => scrollCarousel(targetRef, -1)}>
        ‹
      </button>
      <button aria-label="Próximo" onClick={() => scrollCarousel(targetRef, 1)}>
        ›
      </button>
    </div>
  );
}

const levels = [
  { id: 1, name: 'Fundamentos', desc: 'Variáveis, tipos, entrada e saída.', progress: 5, state: 'done' },
  { id: 2, name: 'Estruturas de controle', desc: 'Condições, laços e lógica booleana.', progress: 3, state: 'done' },
  { id: 3, name: 'Funções', desc: 'Reutilize lógica e organize seu código.', progress: 2, state: 'current' },
  { id: 4, name: 'Coleções', desc: 'Listas, dicionários e buscas eficientes.', progress: 0, state: 'locked' },
  { id: 5, name: 'Algoritmos', desc: 'Ordenação, recursão e complexidade.', progress: 0, state: 'locked' },
];

const challenges = [
  {
    title: 'FizzBuzz Pro',
    desc: 'Regras de divisibilidade em ordem, uma linha por número, sem usar biblioteca.',
    difficulty: 'Fácil',
    level: 'Nível 2',
    solved: '2,1 mil',
  },
  {
    title: 'Palíndromo Eficiente',
    desc: 'Detecção em tempo linear usando dois ponteiros, sem inverter a string.',
    difficulty: 'Médio',
    level: 'Nível 3',
    solved: '940',
  },
  {
    title: 'Merge Sort',
    desc: 'Ordenação estável por divisão e conquista, com recursão explícita.',
    difficulty: 'Difícil',
    level: 'Nível 5',
    solved: '312',
  },
];

const difficultyClass = { Fácil: 'easy', Médio: 'medium', Difícil: 'hard' };

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [manualOpen, setManualOpen] = useState(false);
  const levelGridRef = useRef(null);
  const trackGridRef = useRef(null);

  // Rota protegida devolveu o usuário para cá com o pedido de abrir o login.
  const authOpen = manualOpen || Boolean(location.state?.openAuth);

  // Sem auto-redirecionamento: a home é pública e continua válida para quem já
  // tem conta. Quem entra pelo botão vai para o onboarding, e quem tenta
  // /app/praticar sem responder é devolvido para ele pelo AppShell.

  useEffect(() => {
    let active = true;
    api
      .leaderboard(4)
      .then((payload) => {
        if (active && payload.items.length) setRanking(payload.items);
      })
      .catch(() => {
        // A home não depende do ranking para funcionar.
      });
    return () => {
      active = false;
    };
  }, []);

  function enterApp() {
    navigate('/onboarding', { replace: true });
  }

  return (
    <div className="app-container" id="topo">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="grain" aria-hidden="true" />
      <Header onOpenAuth={() => setManualOpen(true)} />

      <main className="main-content" id="conteudo">
        <Hero />
        <Stats />
        <Marquee />

        <section className="section" id="trilha">
          <div className="container">
            <div className="section-head">
              <span className="kicker">
                <b>01</b> Trilha
              </span>
              <h2>Do primeiro print ao algoritmo de ordenação</h2>
              <p>
                Seis níveis por linguagem. Você só destrava o próximo quando conclui o anterior,
                e o nível atual fica sempre visível no topo.
              </p>
            </div>

            <CarouselButtons targetRef={levelGridRef} />
            <div className="level-grid" ref={levelGridRef}>
              {levels.map((level) => (
                <article
                  className={`panel level-card${level.state === 'current' ? ' is-current' : ''}${
                    level.state === 'locked' ? ' is-locked' : ''
                  }`}
                  key={level.id}
                >
                  <div className="idx">
                    <span>nível {String(level.id).padStart(2, '0')}</span>
                    {level.state === 'current' ? <b>em curso</b> : null}
                    {level.state === 'locked' ? <span>bloqueado</span> : null}
                  </div>
                  <span className="name">{level.name}</span>
                  <p>{level.desc}</p>
                  <div className="pips" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <i key={index} className={index < level.progress ? 'done' : ''} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="linguagens">
          <div className="container">
            <div className="section-head">
              <span className="kicker">
                <b>02</b> Linguagens
              </span>
              <h2>Oito trilhas, do Python ao C#</h2>
              <p>
                Você escolhe uma no cadastro e pode trocar depois sem perder seus pontos. As
                linguagens marcadas como preview rodam no navegador, ao lado do editor.
              </p>
            </div>

            <CarouselButtons targetRef={trackGridRef} />
            <div className="track-grid" ref={trackGridRef}>
              {TRACK_LIST.map((track) => (
                <article className={`panel track-card is-static is-${track.id}`} key={track.id}>
                  <span className="short">{track.short}</span>
                  <span className="body">
                    <span className="name">{track.label}</span>
                    <span className="tagline">{track.tagline}</span>
                    <span className={`run-tag is-${track.execution}`}>
                      {track.execution === 'judge0'
                        ? 'sandbox'
                        : track.execution === 'preview'
                          ? 'preview no navegador'
                          : 'em breve'}
                    </span>
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="desafios">
          <div className="container">
            <div className="section-head">
              <span className="kicker">
                <b>03</b> Desafios
              </span>
              <h2>Semanas de Turing</h2>
              <p>Três desafios organizados por dificuldade, com validação automática e ranking.</p>
            </div>

            <div className="challenge-grid">
              {challenges.map((challenge) => (
                <article className="panel challenge-card" key={challenge.title}>
                  <div className="row">
                    <span className="chip">{challenge.level}</span>
                    <span className={`chip difficulty ${difficultyClass[challenge.difficulty]}`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <span className="title">{challenge.title}</span>
                  <p>{challenge.desc}</p>
                  <div className="foot">
                    <span>{challenge.solved} soluções</span>
                    <Link
                      className="btn btn-outline btn-sm"
                      to={isAuthenticated ? '/app/desafios' : '/entrar'}
                    >
                      Resolver
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="ranking">
          <div className="container">
            <div className="section-head">
              <span className="kicker">
                <b>04</b> Ranking
              </span>
              <h2>Os mais rápidos da temporada</h2>
              <p>Pontos calculados pela API a partir das submissões aceitas.</p>
            </div>

            <div className="ranking-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th className="col-pos">#</th>
                    <th>Usuário</th>
                    <th>Resolvidos</th>
                    <th className="col-points">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row, index) => (
                    <tr key={row.id}>
                      <td className="col-pos">
                        <span className={`rank-pill${index < 3 ? ` top-${index + 1}` : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="col-user">{row.displayName}</td>
                      <td>{row.solvedCount}</td>
                      <td className="col-points">{Number(row.points).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                  {ranking.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="col-points">
                        <span className="skeleton" style={{ display: 'block', width: '100%' }} />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <AuthDialog
        open={authOpen}
        onClose={() => {
          setManualOpen(false);
          if (location.state?.openAuth) {
            navigate(location.pathname, { replace: true, state: null });
          }
        }}
        onSuccess={enterApp}
      />
    </div>
  );
}
