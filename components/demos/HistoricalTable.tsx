/**
 * HistoricalTable Component
 *
 * Reusable table for displaying historical tracking data
 */

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: T) => string | React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface HistoricalTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
}

export function HistoricalTable<T extends Record<string, any>>({
  data,
  columns,
  className = '',
}: HistoricalTableProps<T>) {
  const getAlignClass = (align: string = 'left') => {
    const alignments = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };
    return alignments[align as keyof typeof alignments] || alignments.left;
  };

  const getCellValue = (row: T, column: TableColumn<T>) => {
    const value = row[column.key as keyof T];
    if (column.format) {
      return column.format(value, row);
    }
    return value;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-slate-100 dark:bg-slate-700">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 font-semibold text-gray-900 dark:text-white ${getAlignClass(column.align)} ${column.headerClassName || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
              {columns.map((column, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-4 py-3 ${getAlignClass(column.align)} ${column.className || ''}`}
                >
                  {getCellValue(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * InsightsBox Component
 *
 * Display system insights and patterns detected
 */
interface InsightsBoxProps {
  insights: string[];
  title?: string;
  className?: string;
}

export function InsightsBox({ insights, title = '💡 System Insights', className = '' }: InsightsBoxProps) {
  return (
    <div
      className={`p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 ${className}`}
    >
      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">{title}</h4>
      <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
        {insights.map((insight, idx) => (
          <li key={idx}>• {insight}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Common formatters for table cells
 */
export const TableFormatters = {
  percentage: (value: number) => (
    <span
      className={`font-semibold ${
        value >= 90
          ? 'text-green-600 dark:text-green-400'
          : value >= 80
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400'
      }`}
    >
      {value}%
    </span>
  ),

  currency: (value: number) => (
    <span className="font-semibold text-green-600 dark:text-green-400">
      ${value.toFixed(2)}
    </span>
  ),

  badge: (value: string, color: 'green' | 'yellow' | 'red' | 'blue' = 'blue') => {
    const colors = {
      green: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
      red: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[color]}`}>
        {value}
      </span>
    );
  },

  checkmark: (value: boolean) => (
    value ? (
      <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
    ) : (
      <span className="text-slate-400 text-lg">—</span>
    )
  ),

  duration: (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },
};
