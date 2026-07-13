import { DiceFive } from '@phosphor-icons/react';
import { getDatePresets } from '../utils/dateHelpers';
import { AUTO_GENERATORS } from '../utils/recurringBill';
import DatePicker from './DatePicker';

/**
 * Renders the editable fields for a bill template. Shared by the Generator and
 * the recurring-bill setup wizard so input/validation behaviour stays identical.
 *
 * @param {object}   props
 * @param {object[]} props.fields   template.fields
 * @param {object}   props.values   current form values keyed by field id
 * @param {(id: string, value: any) => void} props.onChange
 * @param {number}   [props.tier]   user tier, for tier-scoped select options
 * @param {string[]} [props.hiddenFieldIds]  field ids to omit (e.g. engine-owned)
 */
const BillFieldsForm = ({ fields, values, onChange, tier = 1, hiddenFieldIds = [] }) => {
  const datePresets = getDatePresets();

  const shouldShowField = (field) => {
    if (hiddenFieldIds.includes(field.id)) return false;
    if (!field.showWhen) return true;
    const { field: dependentField, value: expectedValue } = field.showWhen;
    return values[dependentField] === expectedValue;
  };

  const handleDatePreset = (fieldId, preset) => {
    if (preset === 'today') onChange(fieldId, datePresets.today);
    else if (preset === 'dueDate') onChange(fieldId, datePresets.defaultDueDate);
  };

  const handlePeriodPreset = (fieldId, preset) => {
    const presetData = preset === 'current' ? datePresets.currentMonth : datePresets.lastMonth;
    onChange(fieldId, presetData.label);
  };

  const renderField = (field) => {
    const value = values[field.id] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        );

      case 'number':
      case 'currency':
        return (
          <input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.type === 'currency' ? '0.00' : '0'}
            min="0"
            step={field.type === 'currency' ? '0.01' : '1'}
          />
        );

      case 'date':
        return (
          <div className="field-with-presets">
            <DatePicker value={value} onChange={(val) => onChange(field.id, val)} />
            <div className="field-presets">
              <button
                type="button"
                className="preset-btn"
                onClick={() => handleDatePreset(field.id, 'today')}
              >
                Today
              </button>
              {field.id.toLowerCase().includes('due') && (
                <button
                  type="button"
                  className="preset-btn"
                  onClick={() => handleDatePreset(field.id, 'dueDate')}
                >
                  +15 days
                </button>
              )}
            </div>
          </div>
        );

      case 'period':
        return (
          <div className="field-with-presets">
            <input
              id={field.id}
              type="text"
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder="e.g., January 2024"
            />
            <div className="field-presets">
              <button
                type="button"
                className="preset-btn"
                onClick={() => handlePeriodPreset(field.id, 'last')}
              >
                Last Month
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => handlePeriodPreset(field.id, 'current')}
              >
                This Month
              </button>
            </div>
          </div>
        );

      case 'select': {
        const selectOptions =
          (field.tierOptions && field.tierOptions[Number(tier)]) || field.options || [];
        return (
          <select
            id={field.id}
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            aria-invalid={value === '' ? true : undefined}
          >
            {/* A select with no default otherwise silently displays option[0]
                while storing '' — show an explicit empty state instead. */}
            {value === '' && (
              <option value="" disabled>
                Select {field.label.toLowerCase()}…
              </option>
            )}
            {selectOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }

      case 'toggle':
        return (
          <label className="toggle-field">
            <input
              id={field.id}
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => onChange(field.id, e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">{value ? 'Enabled' : 'Disabled'}</span>
          </label>
        );

      default:
        if (field.autoGenerate && AUTO_GENERATORS[field.autoGenerate]) {
          return (
            <div className="field-with-randomize">
              <input
                id={field.id}
                type="text"
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
              <button
                type="button"
                className="randomize-btn"
                onClick={() => onChange(field.id, AUTO_GENERATORS[field.autoGenerate]())}
                title="Randomize"
                aria-label="Randomize"
              >
                <DiceFive size={20} weight="duotone" />
              </button>
            </div>
          );
        }
        return (
          <input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <>
      {fields.map(
        (field) =>
          shouldShowField(field) && (
            <div key={field.id} className="form-group">
              <label htmlFor={field.id}>{field.label}</label>
              {renderField(field)}
            </div>
          )
      )}
    </>
  );
};

export default BillFieldsForm;
