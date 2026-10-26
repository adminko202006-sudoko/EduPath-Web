import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Bell, Check, ChevronDown, ClipboardCheck, FileCheck2, GraduationCap, Maximize2, Minus, MonitorSmartphone, Plus, ShieldCheck, Sparkles, UsersRound, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import ModalPortal from '../components/ui/ModalPortal';
import content from '../content/aboutEduPath.json';
import teamArtwork from '../assets/about-team/edupath-team.png';
import './About.css';

const featureIcons = { admission: ClipboardCheck, documents: FileCheck2, scholarships: Award, entrance: GraduationCap, online: MonitorSmartphone, updates: Bell };

function ArtworkViewer({ onClose }) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const key = (event) => {
      if (['+', '=', '-', '0'].includes(event.key)) event.preventDefault();
      if (event.key === '+' || event.key === '=') setZoom((value) => Math.min(3, value + 0.25));
      if (event.key === '-') setZoom((value) => Math.max(0.5, value - 0.25));
      if (event.key === '0') setZoom(1);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  return <ModalPortal onEscape={onClose}>
    <div className="ep-about-viewer" role="dialog" aria-modal="true" aria-labelledby="about-art-title" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="ep-about-viewer-panel">
        <div className="ep-about-viewer-heading"><div><h2 id="about-art-title">The spirit of collaboration</h2><p>Original illustrative artwork for EduPath</p></div><button type="button" onClick={onClose} aria-label="Close artwork viewer"><X size={22} /></button></div>
        <div className="ep-about-viewer-image"><img src={teamArtwork} alt="Five illustrated collaborators working together around a laptop" style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} /></div>
        <div className="ep-about-viewer-controls"><button type="button" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}><Minus size={18} /></button><button type="button" aria-label="Reset zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><button type="button" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + 0.25))}><Plus size={18} /></button><span>Scroll to explore when enlarged</span></div>
      </div>
    </div>
  </ModalPortal>;
}

export default function About() {
  const user = useAuth()?.user;
  const [viewArtwork, setViewArtwork] = useState(false);
  const role = ['admin', 'staff', 'applicant'].includes(user?.role) ? user.role : null;
  const destination = role ? `/${role}/dashboard` : '/register';
  const guide = role === 'applicant' || role === 'staff' ? `/${role}/guide` : null;
  return <div className="ep-about page-transition">
    <header className="ep-about-hero">
      <div className="ep-about-hero-copy">
        <p className="ep-about-eyebrow"><span /> About us · EduPath</p><h1>{content.title}</h1><p className="ep-about-hero-intro">{content.introduction}</p>
        <div className="ep-about-actions"><a className="ep-about-button ep-about-button-primary" href="#team">Meet the team <ArrowRight size={17} /></a><a className="ep-about-text-link" href="#platform">Explore the platform <ChevronDown size={16} /></a></div>
        <div className="ep-about-hero-facts"><span><UsersRound size={17} /> Five creators</span><span><MonitorSmartphone size={17} /> Web & mobile</span><span><GraduationCap size={17} /> Trinidad Municipal College</span></div>
      </div>
      <figure className="ep-about-artwork"><button type="button" onClick={() => setViewArtwork(true)} aria-label="Enlarge the EduPath collaboration illustration"><img src={teamArtwork} alt="An illustration of five collaborators bringing an education platform to life" width="1774" height="886" fetchPriority="high" /><span className="ep-about-artwork-expand"><Maximize2 size={16} /></span></button><figcaption><span>Created together.</span> Designed around people.</figcaption></figure>
    </header>
    <nav className="ep-about-section-nav" aria-label="About page sections"><a href="#purpose">Our purpose</a><a href="#platform">The platform</a><a href="#journey">The journey</a><a href="#team">Our team</a><a href="#questions">Questions & help</a></nav>
    <section id="purpose" className="ep-about-purpose ep-about-section" aria-labelledby="about-purpose-title">
      <div><p className="ep-about-eyebrow">Why we built EduPath</p><h2 id="about-purpose-title">Less uncertainty.<br />A clearer next step.</h2><p>{content.purpose}</p></div>
      <div className="ep-about-purpose-cards"><article><span className="ep-about-small-icon"><Sparkles size={20} /></span><h3>Our mission</h3><p>{content.mission}</p></article><article><span className="ep-about-small-icon"><GraduationCap size={20} /></span><h3>Our vision</h3><p>{content.vision}</p></article></div>
    </section>
    <section id="platform" className="ep-about-section" aria-labelledby="about-platform-title">
      <div className="ep-about-section-heading"><div><p className="ep-about-eyebrow">One connected platform</p><h2 id="about-platform-title">From your first application<br className="ep-about-desktop-break" /> to your next opportunity.</h2></div><p>Practical tools for the steps that matter, with the same connected records across web and mobile.</p></div>
      <div className="ep-about-features">{content.features.map((feature) => { const Icon = featureIcons[feature.id]; return <article className="ep-about-feature" key={feature.id}><span className="ep-about-small-icon"><Icon size={23} /></span><h3>{feature.title}</h3><p>{feature.description}</p></article>; })}</div>
      <div id="beneficiaries" className="ep-about-audiences">{content.audiences.map((audience) => <article key={audience.title}><h3>{audience.title}</h3><p>{audience.description}</p></article>)}</div>
    </section>
    <section id="journey" className="ep-about-section ep-about-journey" aria-labelledby="about-journey-title"><p className="ep-about-eyebrow">How it comes together</p><h2 id="about-journey-title">A journey you can follow.</h2><ol>{content.journey.map((step, index) => <li key={step.title}><span className="ep-about-step-number">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol></section>
    <section id="team" className="ep-about-section" aria-labelledby="about-team-title"><span id="gallery" /><div className="ep-about-section-heading"><div><p className="ep-about-eyebrow">The people behind the project</p><h2 id="about-team-title">Meet the EduPath team.</h2></div><p>Five collaborators, with a shared focus on making college applications easier to navigate.</p></div>
      <div className="ep-about-team">{content.team.map((person) => <article className="ep-about-person" key={person.id}>
        <div className="ep-about-portrait" role="img" aria-label={`Symbolic illustrated avatar for ${person.name}`}><img src={teamArtwork} alt="" loading="lazy" decoding="async" style={{ left: `${(0.5 - person.portrait.x * 5.6) * 100}%`, top: `${(0.5 - person.portrait.y * 2.8) * 100}%` }} /></div>
        <h3>{person.name}</h3><p className="ep-about-role">{person.role}</p><p className="ep-about-person-description">{person.description}</p><ul>{person.responsibilities.map((responsibility) => <li key={responsibility}><Check size={14} aria-hidden="true" /><span>{responsibility}</span></li>)}</ul>
      </article>)}</div><p className="ep-about-art-note">{content.artworkNote}</p>
    </section>
    <section className="ep-about-section ep-about-principles" aria-labelledby="about-principles-title"><div><p className="ep-about-eyebrow">What guides our work</p><h2 id="about-principles-title">Clear processes.<br />Thoughtful decisions.</h2></div><div>{content.principles.map((principle) => <article key={principle.title}><ShieldCheck size={20} /><div><h3>{principle.title}</h3><p>{principle.description}</p></div></article>)}</div></section>
    <section id="questions" className="ep-about-section ep-about-faq" aria-labelledby="about-faq-title"><div><p className="ep-about-eyebrow">A little more clarity</p><h2 id="about-faq-title">Questions & help.</h2><p>Start here if you are new to EduPath or need to find the right kind of support.</p></div><div>{content.faq.map((faq) => <details key={faq.question}><summary>{faq.question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}</div></section>
    <section className="ep-about-cta" aria-labelledby="about-next-title"><div><p className="ep-about-eyebrow">Your next step starts here</p><h2 id="about-next-title">Ready to find your path?</h2><p>{content.support}</p></div><div className="ep-about-cta-actions"><Link className="ep-about-button ep-about-button-gold" to={destination}>{role ? 'Go to your dashboard' : 'Create an applicant account'}<ArrowRight size={18} /></Link>{guide && <Link className="ep-about-cta-guide" to={guide}>Open the User Guide</Link>}{!role && <Link className="ep-about-cta-guide" to="/login">Already registered? Sign in</Link>}</div></section>
    <footer className="ep-about-footer"><span>EduPath · {content.subtitle}</span><p>{content.footer}</p></footer>
    {viewArtwork && <ArtworkViewer onClose={() => setViewArtwork(false)} />}
  </div>;
}
