/**
 * ViewTabs Component
 *
 * Reusable tab navigation for demo views (Staff/Manager/Historical)
 */

interface ViewTab {
  id: string;
  label: string;
  icon: string;
}

interface ViewTabsProps {
  views: ViewTab[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  className?: string;
}

export function ViewTabs({ views, activeView, onViewChange, className = '' }: ViewTabsProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-2 mb-8 ${className}`}>
      <div className="flex gap-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeView === view.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {view.icon} {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Common view presets for operations demos
export const STAFF_MANAGER_HISTORICAL_VIEWS: ViewTab[] = [
  { id: 'staff', label: 'Staff View', icon: '👤' },
  { id: 'manager', label: 'Manager View', icon: '📊' },
  { id: 'historical', label: 'Historical', icon: '📈' },
];

export const CHEF_MANAGER_HISTORICAL_VIEWS: ViewTab[] = [
  { id: 'chef', label: "Chef's View", icon: '👨‍🍳' },
  { id: 'manager', label: "Manager's View", icon: '📊' },
  { id: 'historical', label: 'Historical', icon: '📈' },
];

export const HOUSEKEEPER_MANAGER_HISTORICAL_VIEWS: ViewTab[] = [
  { id: 'housekeeper', label: 'Housekeeper View', icon: '🧹' },
  { id: 'manager', label: "Manager's View", icon: '📊' },
  { id: 'historical', label: 'Historical', icon: '📈' },
];
