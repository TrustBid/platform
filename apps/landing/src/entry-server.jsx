import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import App from './App.jsx';
import { LanguageProvider } from './i18n/LanguageProvider.jsx';

export function render(url = '/') {
  return renderToString(
    <LanguageProvider>
      <MemoryRouter initialEntries={[url]}>
        <App />
      </MemoryRouter>
    </LanguageProvider>,
  );
}
