import { useEffect, useRef } from 'react';

/**
 * SpeedReadingView — renders the exact DOM structure speed-reading.js expects,
 * then loads / activates the script.
 */
export default function SpeedReadingView() {
  const activated = useRef(false);

  useEffect(() => {
    if (typeof window.srOnActivate === 'function') {
      window.srOnActivate();
      return;
    }
    const script  = document.createElement('script');
    script.src    = '/speed-reading.js';   // served from /docs via vite proxy or copy
    script.onload = () => {
      if (typeof window.srOnActivate === 'function' && !activated.current) {
        activated.current = true;
        window.srOnActivate();
      }
    };
    document.head.appendChild(script);
    return () => { activated.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section id="view-speed-reading" className="view view-section">
      <div id="sr-home"          className="sr-panel"><div id="sr-home-content"></div></div>
      <div id="sr-assess"        className="sr-panel" style={{display:'none'}}><div id="sr-assess-content"></div></div>
      <div id="sr-rsvp"          className="sr-panel" style={{display:'none'}}><div id="sr-rsvp-content"></div></div>
      <div id="sr-reader"        className="sr-panel" style={{display:'none'}}><div id="sr-reader-content"></div></div>
      <div id="sr-schulte"       className="sr-panel" style={{display:'none'}}><div id="sr-schulte-content"></div></div>
      <div id="sr-progress"      className="sr-panel" style={{display:'none'}}><div id="sr-progress-content"></div></div>
      <div id="sr-lesson-list"   className="sr-panel" style={{display:'none'}}><div id="sr-lesson-list-content"></div></div>
      <div id="sr-lesson-detail" className="sr-panel" style={{display:'none'}}><div id="sr-lesson-detail-content"></div></div>
      <div id="sr-quiz"          className="sr-panel" style={{display:'none'}}><div id="sr-quiz-content"></div></div>
      <div id="sr-result"        className="sr-panel" style={{display:'none'}}><div id="sr-result-content"></div></div>
      <div id="sr-fixation"      className="sr-panel" style={{display:'none'}}><div id="sr-fixation-content"></div></div>
      <div id="sr-periph"        className="sr-panel" style={{display:'none'}}><div id="sr-periph-content"></div></div>
    </section>
  );
}
