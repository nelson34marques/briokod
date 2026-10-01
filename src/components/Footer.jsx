const links = [
  { href: '#trilha', label: 'Trilha' },
  { href: '#linguagens', label: 'Linguagens' },
  { href: '#desafios', label: 'Desafios' },
  { href: '#ranking', label: 'Ranking' },
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span className="footer-brand">
          <span className="brand-mark" aria-hidden="true">
            B
          </span>
          BrioKod
        </span>

        <nav className="footer-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <span>© 2026 BrioKod</span>
      </div>
    </footer>
  );
}

export default Footer;
