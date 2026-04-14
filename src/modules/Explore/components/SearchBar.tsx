import { useState } from 'react';

interface Props {
  initialQuery: string;
  providers: { label: string; value: string, }[];
  selectedProviders: string[];
  setSelectedProviders: React.Dispatch<React.SetStateAction<string[]>>;
  onSearch: (query: string) => void;
}

export default function SearcBar({
  initialQuery,
  providers,
  selectedProviders,
  setSelectedProviders,
  onSearch
}: Props) {

  const [inputValue, setInputValue] = useState(initialQuery);

  const handleChange = (value: string) => {
    setSelectedProviders((prev) => {
      if (prev.includes(value)) {
        return prev.filter((provider) => provider !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 px-4 py-3 bg-df-surface dark:bg-df-surface-dark border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-sm"
    >
      {/* Search input */}
      <search className="flex-1 flex items-center gap-3 min-w-0">
        <svg
          className="w-4.5 h-4.5 text-df-muted dark:text-df-muted-dark shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <label htmlFor="inspiration-search" className="sr-only">
          Busca tu inspiración
        </label>
        <input
          id="inspiration-search"
          type="search"
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            if (newValue.trim() === "") {
              onSearch("");
            }
          }}
          placeholder="Busca tu inspiración (ej. 'Arquitectura Minimalista', 'Neon Tokyo')"
          className="flex-1 min-w-0 bg-transparent text-sm text-df-ink dark:text-df-ink-dark placeholder:text-df-muted dark:placeholder:text-df-muted-dark outline-none"
        />
      </search>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0" aria-hidden="true" />

      {/* Provider filters */}
      <fieldset className="flex items-center gap-4 shrink-0">
        <legend className="text-[9px] font-bold tracking-[0.15em] uppercase text-df-muted dark:text-df-muted-dark pr-1">
          Providers:
        </legend>

        {providers.map(({ label, value }) => (
          <label key={`key-${value}`} className="flex items-center gap-1.5 cursor-pointer group/check">
            <input
              type="checkbox"
              id={`id-${value}`}
              value={value}
              checked={selectedProviders.includes(value)}
              onChange={(e) => handleChange(e.target.value)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#7C3AED] dark:accent-[#A78BFA] cursor-pointer"
            />
            <span className="text-xs font-medium text-df-ink dark:text-df-ink-dark group-hover/check:text-df-primary dark:group-hover/check:text-df-primary-dark transition-colors select-none">
              {label}
            </span>
          </label>
        ))}
      </fieldset>
    </form>
  );
}