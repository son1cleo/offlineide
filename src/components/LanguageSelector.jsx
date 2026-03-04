/**
 * Language Selector Component
 * Allows users to select and change the language for the current file
 */

import { getAllLanguages } from '../utils/languages';
import './LanguageSelector.css';

export function LanguageSelector({ currentLanguage, onChangeLanguage }) {
  const languages = getAllLanguages();

  return (
    <div className="language-selector">
      <label htmlFor="lang-select" className="lang-label">
        📝 Language:
      </label>
      <select
        id="lang-select"
        className="lang-select"
        value={currentLanguage}
        onChange={(e) => onChangeLanguage(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.icon} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
