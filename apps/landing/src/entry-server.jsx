import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { LanguageProvider } from './i18n/LanguageProvider.jsx';

// Used at build time by prerender.js to bake the page's HTML into index.html.
export function render() {
  return renderToString(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  );
}
