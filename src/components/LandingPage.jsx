import './LandingPage.css';

function LandingPage() {
  return (
    <section className="landing" aria-label="SouthForge landing page">
      <div className="landing-impact" aria-hidden="true">
        <span className="impact-flash" />
        <span className="impact-ring" />
        <span className="impact-bolt impact-bolt-a" />
        <span className="impact-bolt impact-bolt-b" />
      </div>

      <div className="landing-core">
        <img className="landing-logo" src="/lightning.svg" alt="SouthForge logo" />
      </div>
    </section>
  );
}

export default LandingPage;
