/**
 * DataEntryForm Component
 *
 * Reusable form for practical data entry after operations
 */

import { useState } from 'react';

interface FormField {
  name: string;
  type: 'text' | 'number' | 'time' | 'checkbox' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  help?: string;
}

interface DataEntryFormProps {
  title: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
  saveDraftLabel?: string;
  onSaveDraft?: (data: Record<string, any>) => void;
  className?: string;
}

export function DataEntryForm({
  title,
  description,
  fields,
  onSubmit,
  submitLabel = 'Submit',
  saveDraftLabel = 'Save Draft',
  onSaveDraft,
  className = '',
}: DataEntryFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => {
      acc[field.name] = field.type === 'checkbox' ? false : '';
      return acc;
    }, {} as Record<string, any>)
  );

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
  };

  const renderField = (field: FormField) => {
    const commonClasses =
      'w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500';

    switch (field.type) {
      case 'checkbox':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-900 dark:text-white">{field.label}</span>
          </label>
        );

      case 'textarea':
        return (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className={commonClasses}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            className={commonClasses}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            className={commonClasses}
          />
        );

      default:
        return (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-slate-600 dark:text-slate-400 mb-6">{description}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            {field.type !== 'checkbox' && (
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {renderField(field)}
            {field.help && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{field.help}</p>
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
          >
            {submitLabel}
          </button>
          {onSaveDraft && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
              {saveDraftLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * QuickTimeEntry Component
 *
 * Simplified time entry for staff (start/end/break)
 */
interface QuickTimeEntryProps {
  title: string;
  predictedMinutes?: number;
  onSubmit: (data: {
    startTime: string;
    endTime: string;
    breakMinutes: number;
    actualMinutes: number;
    notes?: string;
  }) => void;
  className?: string;
}

export function QuickTimeEntry({
  title,
  predictedMinutes,
  onSubmit,
  className = '',
}: QuickTimeEntryProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [notes, setNotes] = useState('');

  const calculateActualMinutes = () => {
    if (!startTime || !endTime) return 0;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return Math.max(0, totalMinutes - breakMinutes);
  };

  const actualMinutes = calculateActualMinutes();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      startTime,
      endTime,
      breakMinutes,
      actualMinutes,
      notes: notes || undefined,
    });
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Quick entry - just tell us when you started and finished
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Break/Lunch Time (minutes)
          </label>
          <input
            type="number"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            min="0"
            step="15"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>

        {actualMinutes > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Actual Work Time:
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.floor(actualMinutes / 60)}h {actualMinutes % 60}m
              </span>
            </div>
            {predictedMinutes && (
              <div className="text-sm text-blue-800 dark:text-blue-200">
                vs Predicted: {Math.floor(predictedMinutes / 60)}h {predictedMinutes % 60}m
                {actualMinutes > predictedMinutes * 1.1 && (
                  <span className="text-orange-600 dark:text-orange-400 ml-2">
                    (⚠️ {Math.round(((actualMinutes - predictedMinutes) / predictedMinutes) * 100)}% over)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any issues, delays, or observations?"
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={!startTime || !endTime}
          className="w-full py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
