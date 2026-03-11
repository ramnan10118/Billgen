import { useState, useRef, useEffect } from 'react';
import './DatePicker.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DatePicker = ({ value, onChange, placeholder = 'DD/MM/YYYY' }) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef(null);

  const parseValue = () => {
    if (!value) return null;
    const parts = value.split('/');
    if (parts.length !== 3) return null;
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    return isNaN(d.getTime()) ? null : d;
  };

  useEffect(() => {
    const parsed = parseValue();
    if (parsed) setViewDate(new Date(parsed));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleSelect = (day) => {
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const y = viewDate.getFullYear();
    onChange(`${d}/${m}/${y}`);
    setOpen(false);
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const selectedDate = parseValue();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<span key={`empty-${i}`} className="dp-cell dp-empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = selectedDate &&
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year;
    const isToday =
      today.getDate() === d &&
      today.getMonth() === month &&
      today.getFullYear() === year;

    cells.push(
      <button
        key={d}
        type="button"
        className={`dp-cell dp-day ${isSelected ? 'dp-selected' : ''} ${isToday ? 'dp-today' : ''}`}
        onClick={() => handleSelect(d)}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="dp-wrapper" ref={containerRef}>
      <div className="dp-input-row">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="dp-toggle"
          onClick={() => setOpen(!open)}
          title="Open calendar"
        >
          📅
        </button>
      </div>
      {open && (
        <div className="dp-dropdown">
          <div className="dp-header">
            <button type="button" className="dp-nav" onClick={prevMonth}>‹</button>
            <span className="dp-month-year">{MONTHS[month]} {year}</span>
            <button type="button" className="dp-nav" onClick={nextMonth}>›</button>
          </div>
          <div className="dp-grid">
            {DAYS.map(d => (
              <span key={d} className="dp-cell dp-weekday">{d}</span>
            ))}
            {cells}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
