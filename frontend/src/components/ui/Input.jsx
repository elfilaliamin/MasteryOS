export const Input = ({
  label,
  error,
  icon: Icon,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  required = false,
  rightElement,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 text-left w-full ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide flex items-center justify-between">
          <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-white dark:bg-slate-900 border ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-700/80 focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20'
          } rounded-xl py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} ${
            rightElement ? 'pr-11' : 'pr-3.5'
          } text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all duration-150`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-rose-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
};
