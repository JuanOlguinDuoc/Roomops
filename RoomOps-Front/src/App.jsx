// Archivo principal de rutas.
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Sidebar from './components/sidebar/Sidebar.jsx'
import Users from './components/users/Users.jsx'
import Login from './components/login/Login.jsx'
import Task from './components/task/Task.jsx'
import Kanban from './components/kanban/Kanban.jsx'
import Apartments from './components/apartments/Apartments.jsx'
import Home from './components/home/Home.jsx'
import { isUserLoggedIn } from './service/localStorage'
import modelo2Logo from './assets/icons/modelo 2.svg'
import './App.css'

function Layout() {
  // Estado global del sidebar para que todo el layout se adapte al ancho actual.
  const [sidebarNarrow, setSidebarNarrow] = useState(true)
  // Estado del sidebar en mobile (drawer overlay).
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  // Breakpoints reales del layout.
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  )
  const [isDesktopView, setIsDesktopView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 992px)').matches
  )

  useEffect(() => {
    const mobileMq = window.matchMedia('(max-width: 767px)')
    const desktopMq = window.matchMedia('(min-width: 992px)')

    const handleMobile = (e) => setIsMobileView(e.matches)
    const handleDesktop = (e) => setIsDesktopView(e.matches)

    mobileMq.addEventListener('change', handleMobile)
    desktopMq.addEventListener('change', handleDesktop)

    return () => {
      mobileMq.removeEventListener('change', handleMobile)
      desktopMq.removeEventListener('change', handleDesktop)
    }
  }, [])

  useEffect(() => {
    // Al salir de mobile, cerramos el drawer para evitar estados inconsistentes.
    if (!isMobileView) {
      setMobileSidebarOpen(false)
    }
  }, [isMobileView])

  const effectiveSidebarNarrow = isDesktopView ? sidebarNarrow : false

  return (
    <div className={`app-shell ${effectiveSidebarNarrow ? 'sidebar-narrow' : 'sidebar-expanded'} ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      {/* Header visible solo en mobile con hamburger y logo. */}
      <header className="app-mobile-header">
        <button
          className="app-hamburger"
          aria-label="Abrir menú"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <span /><span /><span />
        </button>
        <img src={modelo2Logo} alt="RoomOps" className="app-mobile-logo" />
      </header>

      {/* El sidebar notifica cambios de ancho al layout para mantener todo sincronizado. */}
      <Sidebar
        narrow={effectiveSidebarNarrow}
        onNarrowChange={setSidebarNarrow}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="app-main">
        {/* Outlet renderiza la vista activa dentro del contenedor compartido con el sidebar. */}
        <Outlet />
      </main>
    </div>
  )
}

function RequireAuth({ children }) {
  if (!isUserLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RequireGuest({ children }) {
  if (isUserLoggedIn()) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false

    const storedTheme = window.localStorage.getItem('roomops-theme-logo-dark')
    if (storedTheme != null) return storedTheme === '1'

    return window.localStorage.getItem('roomops-dark-mode-invert') === '1'
  })
  const [, setAuthCheckTick] = useState(0)

  useEffect(() => {
    const triggerAuthCheck = () => setAuthCheckTick((prev) => prev + 1)

    const intervalId = window.setInterval(triggerAuthCheck, 30000)
    window.addEventListener('focus', triggerAuthCheck)
    window.addEventListener('authChanged', triggerAuthCheck)
    window.addEventListener('storage', triggerAuthCheck)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', triggerAuthCheck)
      window.removeEventListener('authChanged', triggerAuthCheck)
      window.removeEventListener('storage', triggerAuthCheck)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-logo-dark', isDarkMode)
    window.localStorage.setItem('roomops-theme-logo-dark', isDarkMode ? '1' : '0')
  }, [isDarkMode])

  return (
    <Router>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setIsDarkMode((prev) => !prev)}
        aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
      </button>
      <ToastContainer />

      <Routes>
        <Route
          path="/login"
          element={(
            <RequireGuest>
              <Login />
            </RequireGuest>
          )}
        />

        <Route
          element={(
            <RequireAuth>
              <Layout />
            </RequireAuth>
          )}
        >
          <Route path="/" element={<Home />} />
          <Route path='/tasks' element={<Task />} />
          <Route path="/home" element={<Home />} />
          <Route path='/users' element={<Users />} />
          <Route path='/apartments' element={<Apartments />} />
          <Route path='/kanban' element={<Kanban />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App