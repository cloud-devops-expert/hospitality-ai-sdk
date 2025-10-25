/**
 * ROIMetrics Component
 *
 * Reusable metrics display for showing cost savings and ROI
 */

interface ROIMetric {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: 'green' | 'blue' | 'purple' | 'orange';
}

interface ROIMetricsProps {
  title?: string;
  metrics: ROIMetric[];
  className?: string;
}

export function ROIMetrics({ title, metrics, className = '' }: ROIMetricsProps) {
  const getColorClasses = (color: string = 'blue') => {
    const colors = {
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getSublabelColor = (color: string = 'blue') => {
    const colors = {
      green: 'text-green-700 dark:text-green-300',
      blue: 'text-blue-700 dark:text-blue-300',
      purple: 'text-purple-700 dark:text-purple-300',
      orange: 'text-orange-700 dark:text-orange-300',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div className={`grid ${metrics.length <= 2 ? 'grid-cols-2' : metrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-4 text-center ${getColorClasses(metric.color)}`}
          >
            <div className="text-3xl font-bold mb-1">
              {typeof metric.value === 'number' ? metric.value.toFixed(0) : metric.value}
            </div>
            <div className="text-sm font-medium">{metric.label}</div>
            {metric.sublabel && (
              <div className={`text-xs mt-1 ${getSublabelColor(metric.color)}`}>
                {metric.sublabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ROICard Component
 *
 * Full-width gradient card for highlighting overall ROI
 */
interface ROICardProps {
  title: string;
  metrics: ROIMetric[];
  description?: string;
  className?: string;
}

export function ROICard({ title, metrics, description, className = '' }: ROICardProps) {
  return (
    <div
      className={`bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-800 dark:to-emerald-800 rounded-xl shadow-lg p-8 text-white ${className}`}
    >
      <h2 className="text-3xl font-bold mb-6">{title}</h2>

      <div className={`grid ${metrics.length <= 2 ? 'grid-cols-2' : metrics.length === 3 ? 'grid-cols-3' : 'md:grid-cols-4'} gap-6 mb-6`}>
        {metrics.map((metric, idx) => (
          <div key={idx}>
            <div className="text-4xl font-bold mb-1">
              {typeof metric.value === 'number' ? metric.value.toFixed(0) : metric.value}
            </div>
            <div className="text-green-100">{metric.label}</div>
            {metric.sublabel && <div className="text-sm text-green-200 mt-1">{metric.sublabel}</div>}
          </div>
        ))}
      </div>

      {description && (
        <div className="border-t border-green-500 pt-4">
          <p className="text-green-100">{description}</p>
        </div>
      )}
    </div>
  );
}
