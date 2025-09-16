import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './AuthProvider.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { Provider } from 'react-redux'
import { store } from './redux/store.ts'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
         <Provider store={store}>  
          <App />
          </Provider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)


