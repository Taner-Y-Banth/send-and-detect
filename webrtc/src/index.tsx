import { createContext } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NstrumentaBrowserClient } from 'nstrumenta/dist/browser/client';

const client = new NstrumentaBrowserClient();

export const ClientContext = createContext<NstrumentaBrowserClient>(client);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ClientContext.Provider value={client}>
    <App />
  </ClientContext.Provider>
);
