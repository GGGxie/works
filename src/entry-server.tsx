import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import type { Config } from './types';
import './i18n';

export function render(url: string, config: Config) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App initialConfig={config} />
      </StaticRouter>
    </StrictMode>
  );
}
