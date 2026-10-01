const languages = [
  'Python 3',
  'JavaScript',
  'C',
  'C++',
  'Java',
  'Go',
  'Ruby',
  'TypeScript',
  'Rust',
  'SQL',
  'Kotlin',
  'PHP',
  'Swift',
  'Dart',
];

function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[...languages, ...languages].map((language, index) => (
          <span key={`${language}-${index}`}>{language}</span>
        ))}
      </div>
    </div>
  );
}

export default Marquee;
