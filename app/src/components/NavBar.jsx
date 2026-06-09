const NAVS = [
  { view: 'drill',         label: 'Drill'      },
  { view: 'home',          label: 'Home'       },
  { view: 'speed-reading', label: 'Speed'      },
  { view: 'learn',         label: 'Learn'      },
  { view: 'stats',         label: 'Stats'      },
  { view: 'assessment',    label: 'Assess'     },
  { view: 'tools',         label: 'Tools'      },
  { view: 'scripture',     label: 'Scripture'  },
  { view: 'data',          label: 'Data'       },
];

export default function NavBar({ currentView, onNavigate }) {
  return (
    <nav className="app-nav" aria-label="Site navigation">
      {NAVS.map(({ view, label }) => (
        <button
          key={view}
          className={`nav-btn${currentView === view ? ' active' : ''}`}
          onClick={() => onNavigate(view)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
