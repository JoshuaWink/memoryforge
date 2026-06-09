import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppProvider } from './context/AppContext.jsx';
import NavBar from './components/NavBar.jsx';
import DrillView         from './views/DrillView/index.jsx';
import HomeView          from './views/HomeView/index.jsx';
import SpeedReadingView  from './views/SpeedReadingView/index.jsx';
import ToolsView         from './views/ToolsView/index.jsx';
import AssessmentView    from './views/AssessmentView/index.jsx';
import LearnView         from './views/LearnView/index.jsx';
import StatsView         from './views/StatsView/index.jsx';
import ScriptureView     from './views/ScriptureView/index.jsx';
import DataView          from './views/DataView/index.jsx';

const VIEW_MAP = {
  drill:         DrillView,
  home:          HomeView,
  'speed-reading': SpeedReadingView,
  tools:         ToolsView,
  assessment:    AssessmentView,
  learn:         LearnView,
  stats:         StatsView,
  scripture:     ScriptureView,
  data:          DataView,
};

function parseHash() {
  const h = (location.hash || '').replace('#', '');
  return VIEW_MAP[h] ? h : 'home';
}

export default function App() {
  const [currentView, setCurrentView] = useState(parseHash);

  const navigate = useCallback((view) => {
    setCurrentView(view);
    history.pushState({}, '', '#' + view);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => setCurrentView(parseHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const ViewComponent = VIEW_MAP[currentView] || HomeView;
  const siteNav = document.getElementById('site-nav');

  return (
    <AppProvider navigate={navigate}>
      {siteNav && createPortal(
        <NavBar currentView={currentView} onNavigate={navigate} />,
        siteNav
      )}
      <ViewComponent navigate={navigate} />
    </AppProvider>
  );
}
