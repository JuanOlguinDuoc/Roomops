import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardList,
  Search,
  ShieldAlert,
  TrendingUp
} from 'lucide-react'
import { getTasks } from '../../service/taskService'
import { getUsers } from '../../service/userService'
import { getApartments } from '../../service/apartmentService'
import { getStatuses } from '../../service/statusService'
import { getAllUsers, getCurrentUser, isUserLoggedIn } from '../../service/localStorage'
import {
  canViewAdminDashboard,
  filterTasksByPermissions,
  canViewAnyKanban,
  canViewUsers
} from '../../service/permissions'
import {
  getChecklistOverallStatusKey,
  getTaskApartmentId,
  getTaskAssignedUserId,
  getTaskDate,
  getTaskDueTime,
  getTaskStatusId,
  getTaskType,
  getLocalTasks,
  normalizeTaskText,
  getPriorityByType,
  updateTaskLocal,
  resolveTaskStatusIdFromChecklist
} from '../task/TaskFunctions'
import { TaskDetailPanel } from '../taskDetail'
import { updateTask } from '../../service/taskService'
import { showErrorToast, showSuccessToast } from '../../utils/toast'
import './Home.css'
import Swal from 'sweetalert2'
import { cilGraph } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const STATUS_ORDER = ['pending', 'in-progress', 'done', 'blocked']

const STATUS_META = {
  pending: {
    label: 'Pendiente',
    accent: '#98A2B3',
    icon: Clock3,
    fill: '#98A2B3'
  },
  'in-progress': {
    label: 'En Progreso',
    accent: '#F59E0B',
    icon: TrendingUp,
    fill: '#F59E0B'
  },
  done: {
    label: 'Hecho',
    accent: '#10B981',
    icon: CheckCircle2,
    fill: '#10B981'
  },
  blocked: {
    label: 'Bloqueada',
    accent: '#F43F5E',
    icon: ShieldAlert,
    fill: '#F43F5E'
  }
}

const PRIORITY_META = {
  high: { label: 'ALTA', className: 'is-high' },
  medium: { label: 'MEDIA', className: 'is-medium' },
  low: { label: 'BAJA', className: 'is-low' }
}

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'today', label: 'Hoy' },
  { value: 'all', label: 'Todo' }
]

const COMPLETED_NOTIFICATIONS_KEY = 'roomops-completed-notifications'
const TASK_STATUS_SNAPSHOT_KEY = 'roomops-task-status-snapshot'

const buildScopedStorageKey = (baseKey, user) => {
  const userId = user?.id ?? user?.email ?? user?.run ?? user?.role ?? 'anonymous'
  return `${baseKey}-${String(userId).trim().toLowerCase()}`
}

const normalizeId = (value) => (value == null || value === '' ? null : Number(value))

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildDemoData = () => {
  const today = new Date()

  return {
    tasks: [
      {
        id: 1,
        titulo: 'Limpieza Profunda',
        apartmentId: 1,
        assignedUserId: 1,
        statusId: 2,
        fecha: formatDate(addDays(today, -1)),
        dueTime: '09:00',
        tipo: 'Aseo'
      },
      {
        id: 2,
        titulo: 'Cambio de Sábanas',
        apartmentId: 2,
        assignedUserId: 2,
        statusId: 1,
        fecha: formatDate(addDays(today, -2)),
        dueTime: '11:30',
        tipo: 'Aseo'
      },
      {
        id: 3,
        titulo: 'Reparación de Aire',
        apartmentId: 3,
        assignedUserId: 3,
        statusId: 4,
        fecha: formatDate(today),
        dueTime: '13:15',
        tipo: 'Mantención'
      },
      {
        id: 4,
        titulo: 'Mantenimiento Preventivo',
        apartmentId: 5,
        assignedUserId: 2,
        statusId: 3,
        fecha: formatDate(addDays(today, -3)),
        dueTime: '15:00',
        tipo: 'Mantención'
      },
      {
        id: 5,
        titulo: 'Revisión de Inventario',
        apartmentId: 4,
        assignedUserId: 1,
        statusId: 2,
        fecha: formatDate(addDays(today, -4)),
        dueTime: '17:45',
        tipo: 'Inspección'
      }
    ],
    users: [
      { id: 1, nombre: 'Apt 1' },
      { id: 2, nombre: 'Apt 2' },
      { id: 3, nombre: 'Apt 3' }
    ],
    apartments: [
      { id: 1, nombre: 'Apt 1' },
      { id: 2, nombre: 'Apt 2' },
      { id: 3, nombre: 'Apt 3' },
      { id: 4, nombre: 'Apt 4' },
      { id: 5, nombre: 'Apt 5' }
    ],
    statuses: [
      { id: 1, nombre: 'Pendiente' },
      { id: 2, nombre: 'En Progreso' },
      { id: 3, nombre: 'Hecho' },
      { id: 4, nombre: 'Bloqueada' }
    ]
  }
}

const normalizeStatusKey = (value = '') => {
  const text = normalizeTaskText(value)

  if (text.includes('bloque')) return 'blocked'
  if (text.includes('progreso') || text.includes('curso') || text.includes('avance')) return 'in-progress'
  if (text.includes('hecho') || text.includes('complet') || text.includes('done')) return 'done'
  if (text.includes('pendiente') || text.includes('por hacer') || text.includes('todo')) return 'pending'

  return 'pending'
}

const getRecordLabel = (record, fallback) => {
  if (!record) return fallback

  const label =
    record.nombre ||
    record.name ||
    record.titulo ||
    record.title ||
    record.descripcion ||
    record.numero ||
    record.code

  return label ? String(label) : fallback
}

const getTaskStatusKey = (task, statusesById) => {
  const statusId = normalizeId(getTaskStatusId(task))
  const statusRecord = statusId != null ? statusesById.get(statusId) : null
  const fromCatalog = statusRecord ? getRecordLabel(statusRecord, '') : ''

  if (fromCatalog) {
    return normalizeStatusKey(fromCatalog)
  }

  const explicitStatus =
    task?.estado ||
    task?.status ||
    task?.statusName ||
    task?.estadoNombre ||
    task?.statusLabel ||
    ''

  if (explicitStatus) {
    return normalizeStatusKey(explicitStatus)
  }

  const checklist = task?.checklist || task?.listaVerificacion || []
  return getChecklistOverallStatusKey(checklist)
}

const getChecklistBlockedItems = (task = {}) => {
  const checklist = task?.checklist || task?.listaVerificacion || []
  if (!Array.isArray(checklist) || checklist.length === 0) return []

  return checklist
    .map((item, index) => {
      const rawState = item?.estado || item?.status || item?.checklistStatus || item?.estadoChecklist || ''
      const normalizedState = normalizeTaskText(rawState)

      if (!normalizedState.includes('bloquead') && !normalizedState.includes('blocked')) {
        return null
      }

      const title = item?.titulo || item?.title || item?.nombre || item?.descripcion || `Item ${index + 1}`
      const note = item?.nota || item?.observacion || item?.comentario || item?.detalle || ''

      return {
        title: String(title),
        note: String(note || '')
      }
    })
    .filter(Boolean)
}

const formatDateLabel = (value) => {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const parseLocalDate = (rawValue) => {
  if (!rawValue) return null

  if (rawValue instanceof Date) {
    return Number.isNaN(rawValue.getTime()) ? null : rawValue
  }

  const value = String(rawValue).trim()
  if (!value) return null

  // Parse YYYY-MM-DD as local date to avoid timezone offset issues.
  const onlyDate = value.includes('T') ? value.split('T')[0] : value
  const parts = onlyDate.split('-')

  if (parts.length === 3) {
    const [year, month, day] = parts.map((part) => Number(part))
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      const local = new Date(year, month - 1, day)
      if (!Number.isNaN(local.getTime())) {
        return local
      }
    }
  }

  const fallback = new Date(value)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

const matchesPeriod = (task, period) => {
  if (period === 'all') return true

  const rawDate = getTaskDate(task)
  if (!rawDate) return true

  const date = parseLocalDate(rawDate)
  if (!date) return true

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

  if (period === 'today') {
    return date >= startOfToday && date <= endOfToday
  }

  if (period === 'week') {
    const weekAgo = addDays(startOfToday, -7)
    return date >= weekAgo
  }

  if (period === 'month') {
    const monthAgo = addDays(startOfToday, -30)
    return date >= monthAgo
  }

  return true
}

const sortByRecentDate = (left, right) => {
  const leftDate = new Date(`${getTaskDate(left) || ''}T${getTaskDeadlineTime(left) || '00:00'}`)
  const rightDate = new Date(`${getTaskDate(right) || ''}T${getTaskDeadlineTime(right) || '00:00'}`)

  const leftTime = Number.isNaN(leftDate.getTime()) ? 0 : leftDate.getTime()
  const rightTime = Number.isNaN(rightDate.getTime()) ? 0 : rightDate.getTime()

  return rightTime - leftTime || Number(right.id || 0) - Number(left.id || 0)
}

const getTaskTypeLabel = (task = {}) => {
  const raw = normalizeTaskText(getTaskType(task) || task?.tipo || task?.type || '')
  if (raw.includes('mant')) return 'MANTENCION'
  if (raw.includes('aseo') || raw.includes('limpieza')) return 'ASEO'
  if (raw.includes('rep')) return 'REPASO'
  return raw ? String(raw).toUpperCase() : 'SIN TIPO'
}

const getTaskDeadlineTime = (task = {}) => {
  const typeLabel = getTaskTypeLabel(task)
  if (typeLabel === 'ASEO') return '16:00'
  if (typeLabel === 'REPASO') return '16:00'
  if (typeLabel === 'MANTENCION') return '15:00'
  return getTaskDueTime(task) || ''
}

const getTaskPriorityKey = (task = {}) => {
  const explicit = normalizeTaskText(task?.prioridad || task?.priority || task?.nivelPrioridad || '')
  if (explicit.includes('alta') || explicit.includes('high') || explicit === '1') return 'high'
  if (explicit.includes('baja') || explicit.includes('low') || explicit === '3') return 'low'
  if (explicit.includes('media') || explicit.includes('medium') || explicit === '2') return 'medium'

  const typeLabel = getTaskTypeLabel(task)
  if (typeLabel === 'MANTENCION') return 'high'
  if (typeLabel === 'ASEO') return 'medium'
  if (typeLabel === 'REPASO') return 'low'
  return 'low'
}

const isTaskOverdue = (task = {}, statusById = new Map()) => {
  const statusKey = getTaskStatusKey(task, statusById)
  if (statusKey === 'done') return false

  const rawDate = getTaskDate(task)
  if (!rawDate) return false

  const dueDate = parseLocalDate(rawDate)
  if (!dueDate) return false

  const [hours, minutes] = String(getTaskDeadlineTime(task) || '23:59').split(':').map((value) => Number(value))
  dueDate.setHours(Number.isFinite(hours) ? hours : 23, Number.isFinite(minutes) ? minutes : 59, 0, 0)

  return dueDate.getTime() < Date.now()
}

function WorkerDashboard() {
  const [tasks, setTasks] = useState([])
  const [apartments, setApartments] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)

  const refreshWorkerData = async () => {
    setLoading(true)
    const [tasksRes, aptsRes, statusesRes] = await Promise.allSettled([
      getTasks(),
      getApartments(),
      getStatuses()
    ])

    setTasks(tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value) ? tasksRes.value : [])
    setApartments(aptsRes.status === 'fulfilled' && Array.isArray(aptsRes.value) ? aptsRes.value : [])
    setStatuses(statusesRes.status === 'fulfilled' && Array.isArray(statusesRes.value) ? statusesRes.value : [])
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      if (!isMounted) return
      await refreshWorkerData()
    }
    load()
    return () => { isMounted = false }
  }, [])

  const handleSaveTaskChecklist = async (task, checklistItems = []) => {
    const taskId = task?.id
    if (taskId == null) return false

    const typeLabel = getTaskType(task)
    const nextStatusId = resolveTaskStatusIdFromChecklist(statuses, checklistItems, getTaskStatusId(task))
    const payload = {
      titulo: task?.titulo || '',
      descripcion: task?.descripcion || '',
      tipo: typeLabel || '',
      prioridad: task?.prioridad ?? task?.priority ?? getPriorityByType(typeLabel),
      fecha: getTaskDate(task) || null,
      dueTime: getTaskDueTime(task) || null,
      apartmentId: getTaskApartmentId(task),
      assignedUserId: getTaskAssignedUserId(task),
      statusId: nextStatusId,
      estadoId: nextStatusId,
      checklist: Array.isArray(checklistItems) ? checklistItems : []
    }

    try {
      try {
        await updateTask(taskId, payload)
      } catch (err) {
        const localResult = updateTaskLocal(taskId, payload)
        if (!localResult?.success) {
          throw new Error(localResult?.message || 'No se pudo actualizar el checklist en localStorage')
        }
        showErrorToast('Se uso copia local por falla del servidor')
      }

      showSuccessToast('Checklist actualizado')
      await refreshWorkerData()
      return true
    } catch (err) {
      console.error('Error updating worker checklist', err)
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error actualizando checklist'
      showErrorToast(msg)
      return false
    }
  }

  const statusById = useMemo(() => new Map(statuses.map(s => [normalizeId(s.id), s])), [statuses])
  const apartmentById = useMemo(() => new Map(apartments.map(a => [normalizeId(a.id), a])), [apartments])
  const apartmentNameById = useMemo(() => {
    const map = new Map()
    apartments.forEach((apartment) => {
      if (apartment?.id != null) {
        map.set(Number(apartment.id), apartment.nombre || `Apartamento ${apartment.id}`)
      }
    })
    return map
  }, [apartments])
  const statusNameById = useMemo(() => {
    const map = new Map()
    statuses.forEach((status) => {
      if (status?.id != null) {
        map.set(Number(status.id), status.nombre || `Estado ${status.id}`)
      }
    })
    return map
  }, [statuses])
  const myTasks = useMemo(() => filterTasksByPermissions(tasks), [tasks])
  const canOpenKanban = canViewAnyKanban()

  const pendingCount = useMemo(
    () => myTasks.filter(t => getTaskStatusKey(t, statusById) === 'pending').length,
    [myTasks, statusById]
  )
  const inProgressCount = useMemo(
    () => myTasks.filter(t => getTaskStatusKey(t, statusById) === 'in-progress').length,
    [myTasks, statusById]
  )
  const doneTodayCount = useMemo(() => {
    const today = new Date()
    return myTasks.filter(t => {
      if (getTaskStatusKey(t, statusById) !== 'done') return false
      const d = parseLocalDate(getTaskDate(t))
      return d && d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
    }).length
  }, [myTasks, statusById])

  const nextUrgentTask = useMemo(() => {
    const active = myTasks.filter(t => {
      const key = getTaskStatusKey(t, statusById)
      return key === 'pending' || key === 'in-progress'
    })
    return active.sort((a, b) => {
      const aDate = new Date(`${getTaskDate(a) || '9999-12-31'}T${getTaskDeadlineTime(a) || '23:59'}`)
      const bDate = new Date(`${getTaskDate(b) || '9999-12-31'}T${getTaskDeadlineTime(b) || '23:59'}`)
      return aDate - bDate
    })[0] || null
  }, [myTasks, statusById])

  const recentTasks = useMemo(() => [...myTasks].sort(sortByRecentDate).slice(0, 5), [myTasks])
  const completedCount = useMemo(() => myTasks.filter((task) => getTaskStatusKey(task, statusById) === 'done').length, [myTasks, statusById])
  const progressPercent = useMemo(() => {
    if (!myTasks.length) return 0
    return Math.round((completedCount / myTasks.length) * 100)
  }, [completedCount, myTasks])

  const handleOpenTaskDetail = (task) => {
    setSelectedTaskDetail(task)
    setIsTaskDetailOpen(true)
  }

  const handleCloseTaskDetail = () => {
    setIsTaskDetailOpen(false)
    setSelectedTaskDetail(null)
  }

  if (loading) {
    return (
      <section className="home-dashboard">
        <div className="home-loading">Cargando tus tareas...</div>
      </section>
    )
  }

  const urgentApt = nextUrgentTask
    ? getRecordLabel(apartmentById.get(normalizeId(getTaskApartmentId(nextUrgentTask))), '')
    : ''
  const urgentStatusKey = nextUrgentTask ? getTaskStatusKey(nextUrgentTask, statusById) : 'pending'
  const urgentStatusMeta = STATUS_META[urgentStatusKey] || STATUS_META.pending
  const urgentTypeLabel = nextUrgentTask ? getTaskTypeLabel(nextUrgentTask) : 'SIN TIPO'
  const urgentPriorityKey = nextUrgentTask ? getTaskPriorityKey(nextUrgentTask) : 'medium'
  const urgentPriorityMeta = PRIORITY_META[urgentPriorityKey] || PRIORITY_META.medium
  const urgentIsOverdue = nextUrgentTask ? isTaskOverdue(nextUrgentTask, statusById) : false
  const urgentDeadline = nextUrgentTask ? getTaskDeadlineTime(nextUrgentTask) : ''

  return (
    <section className="home-dashboard">
      <header className="home-topbar">
        <div className="home-topbar-heading">
          <h1 className="home-title"> <CIcon icon={cilGraph} size="xxl" /> Dashboard Personal</h1>
          <p className="home-subtitle">Vista de tus tareas asignadas</p>
        </div>
      </header>

      <div className="home-metrics-grid home-worker-metrics">
        <MetricCard icon={Clock3} title="Pendientes" value={pendingCount} helper="Sin iniciar" tone="slate" />
        <MetricCard icon={TrendingUp} title="En Progreso" value={inProgressCount} helper="En curso" tone="amber" />
        <MetricCard icon={CheckCircle2} title="Hechas hoy" value={doneTodayCount} helper="Completadas hoy" tone="green" />
      </div>

      <div className="home-content-grid home-worker-content-grid">
        <div className="home-worker-main">
          <article className="home-panel home-worker-urgent-panel">
            <div className="home-panel-head">
              <h2 className="home-panel-title">Próxima tarea urgente</h2>
            </div>
            {nextUrgentTask ? (
              <div className="home-urgent-body">
                <span className="home-urgent-bar" style={{ backgroundColor: urgentStatusMeta.fill }} />
                <div className="home-worker-badges-row">
                  <span className="home-badge home-badge-type">{urgentTypeLabel}</span>
                  <span className={`home-badge home-badge-priority ${urgentPriorityMeta.className}`}>{urgentPriorityMeta.label}</span>
                  <span className={`home-badge home-badge-status is-${urgentStatusKey}`}>{urgentStatusMeta.label.toUpperCase()}</span>
                  {urgentIsOverdue && <span className="home-badge home-badge-overdue">ATRASADA</span>}
                </div>
                <div className="home-urgent-info">
                  <h3 className="home-urgent-title">{nextUrgentTask.titulo || 'Sin título'}</h3>
                  {urgentApt && <p className="home-urgent-apt">{urgentApt}</p>}
                  <div className="home-urgent-meta">
                    <span className="home-urgent-date">{getTaskDate(nextUrgentTask) ? formatDateLabel(getTaskDate(nextUrgentTask)) : 'Sin fecha'}</span>
                    {urgentDeadline && (
                      <span className="home-urgent-time">
                        <Clock3 size={13} /> Hora límite: <strong>{urgentDeadline}</strong>
                      </span>
                    )}
                    <span className="home-urgent-type-note">Tipo: {urgentTypeLabel}</span>
                    <span className="home-urgent-priority-note">Prioridad: {urgentPriorityMeta.label}</span>
                  </div>
                </div>
                <button type="button" className="home-urgent-btn" onClick={() => handleOpenTaskDetail(nextUrgentTask)}>Ver detalle</button>
              </div>
            ) : (
              <div className="home-empty-state">
                <p>No tienes tareas pendientes. ¡Buen trabajo!</p>
              </div>
            )}
          </article>

          <article className="home-panel home-worker-progress-panel">
            <div className="home-panel-head">
              <h2 className="home-panel-title">Progreso del día</h2>
            </div>
            <div className="home-worker-progress-body">
              <p className="home-worker-progress-summary">{completedCount} de {myTasks.length} tareas completadas</p>
              <div className="home-worker-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} aria-label="Progreso del día">
                <div className="home-worker-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="home-worker-progress-percent">{progressPercent}%</span>
            </div>
          </article>
        </div>

        <aside className="home-panel home-recent-panel">
          <div className="home-panel-head home-recent-head">
            <h2 className="home-panel-title">Mis tareas recientes</h2>
          </div>
          <div className="home-recent-list">
            {recentTasks.length === 0 ? (
              <div className="home-empty-state"><p>No hay tareas recientes.</p></div>
            ) : (
              recentTasks.map(task => {
                const statusKey = getTaskStatusKey(task, statusById)
                const statusMeta = STATUS_META[statusKey] || STATUS_META.pending
                const aptLabel = getRecordLabel(apartmentById.get(normalizeId(getTaskApartmentId(task))), '')
                const typeLabel = getTaskTypeLabel(task)
                return (
                  <article key={task.id} className="home-recent-item home-recent-clickable" role="button" tabIndex={0} onClick={() => handleOpenTaskDetail(task)} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && handleOpenTaskDetail(task)}>
                    <span className="home-recent-accent" style={{ backgroundColor: statusMeta.fill }} />
                    <div className="home-recent-body">
                      <div className="home-recent-row">
                        <div>
                          <h3 className="home-recent-title">{task.titulo || 'Sin título'}</h3>
                          <p className="home-recent-meta">{aptLabel || 'Sin apartamento'} · {formatDateLabel(getTaskDate(task))}</p>
                        </div>
                        <span className={`home-badge home-badge-status is-${statusKey}`}>
                          {statusMeta.label.toUpperCase()} · {typeLabel}
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
          <div className="home-worker-actions">
            <Link to="/tasks" className="home-view-all">Ver mis tareas</Link>
            {canOpenKanban && <Link to="/kanban" className="home-view-all">Abrir Kanban</Link>}
          </div>
        </aside>
      </div>

      <TaskDetailPanel
        isOpen={isTaskDetailOpen}
        task={selectedTaskDetail}
        onClose={handleCloseTaskDetail}
        apartmentNameById={apartmentNameById}
        userNameById={new Map()}
        statusNameById={statusNameById}
        onSaveChecklist={handleSaveTaskChecklist}
        getDeadLine={(taskType) => {
          const normalizedTaskType = normalizeTaskText(taskType || '')
          if (normalizedTaskType.includes('aseo') || normalizedTaskType.includes('limpieza')) {
            return '18:00'
          }
          return getTaskDeadlineTime(selectedTaskDetail) || 'Sin hora'
        }}
      />
    </section>
  )
}

function MetricCard({ icon: Icon, title, value, helper, tone = 'neutral' }) {
  return (
    <article className={`home-metric-card tone-${tone}`}>
      <div className="home-metric-head">
        <span className="home-metric-icon"><Icon size={20} /></span>
        <span className="home-metric-helper">{helper}</span>
      </div>
      <p className="home-metric-title">{title}</p>
      <strong className="home-metric-value">{value}</strong>
    </article>
  )
}

export default function Home() {
  const isLoggedIn = isUserLoggedIn()
  const hasAdminDashboard = canViewAdminDashboard()
  const currentUser = getCurrentUser()
  const notificationsStorageKey = useMemo(() => buildScopedStorageKey(COMPLETED_NOTIFICATIONS_KEY, currentUser), [currentUser])
  const taskSnapshotStorageKey = useMemo(() => buildScopedStorageKey(TASK_STATUS_SNAPSHOT_KEY, currentUser), [currentUser])

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Los trabajadores no pueden ver el dashboard administrativo
  if (!hasAdminDashboard) {
    return <WorkerDashboard />
  }
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [apartments, setApartments] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [period, setPeriod] = useState('week')
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(notificationsStorageKey)
      const parsed = raw ? JSON.parse(raw) : []
      setNotifications(Array.isArray(parsed) ? parsed : [])
    } catch {
      setNotifications([])
    }
  }, [notificationsStorageKey])

  useEffect(() => {
    let isMounted = true

    const loadHomeData = async () => {
      setLoading(true)

      const usersFetch = canViewUsers() ? getUsers() : Promise.resolve([])
      const [tasksResult, usersResult, apartmentsResult, statusesResult] = await Promise.allSettled([
        getTasks(),
        usersFetch,
        getApartments(),
        getStatuses()
      ])

      if (!isMounted) return

      const apiSucceeded = tasksResult.status === 'fulfilled' && Array.isArray(tasksResult.value)
      const apiTasks = apiSucceeded ? tasksResult.value : getLocalTasks()
      const demo = buildDemoData()
      const useDemoData = !apiSucceeded && apiTasks.length === 0
      const finalTasks = useDemoData ? demo.tasks : apiTasks

      setTasks(finalTasks)
      setUsers(usersResult.status === 'fulfilled' && Array.isArray(usersResult.value) && usersResult.value.length > 0 ? usersResult.value : (useDemoData ? demo.users : getAllUsers()))
      setApartments(apartmentsResult.status === 'fulfilled' && Array.isArray(apartmentsResult.value) && apartmentsResult.value.length > 0 ? apartmentsResult.value : (useDemoData ? demo.apartments : []))
      setStatuses(statusesResult.status === 'fulfilled' && Array.isArray(statusesResult.value) && statusesResult.value.length > 0 ? statusesResult.value : (useDemoData ? demo.statuses : []))
      setLoading(false)
    }

    loadHomeData()

    return () => {
      isMounted = false
    }
  }, [])

  //Contador de notificaciones
  const unreadCount = useMemo(() => notifications.filter((item) => !item?.read).length, [notifications])

  //Handelr del popup de notificaciones
  const handleNotificationsClick = async () => {
    const isDarkTheme = document.documentElement.classList.contains('theme-logo-dark')
    const swalThemeOptions = isDarkTheme
      ? {
        background: '#161129',
        color: '#f8fafc',
        confirmButtonColor: '#5459AC',
        iconColor: '#66C2FF'
      }
      : {
        background: '#ffffff',
        color: '#334155',
        confirmButtonColor: '#4f46e5'
      }

    if (!notifications.length) {
      await Swal.fire({
        icon: 'info',
        title: 'Notificaciones',
        text: 'Aún no hay tareas completadas o bloqueadas para mostrar.',
        ...swalThemeOptions
      })
      return  
    }

    const itemsHtml = notifications
      .slice(0,10)
      .map((n) => {
        const isBlocked = n?.state === 'blocked'
        const stateLabel = isBlocked ? 'Bloqueada' : 'Completada'
        const cardBackground = isBlocked ? 'rgba(239, 68, 68, 0.14)' : 'rgba(16, 185, 129, 0.14)'
        const cardBorder = isBlocked ? '1px solid rgba(248, 113, 113, 0.55)' : '1px solid rgba(74, 222, 128, 0.55)'
        const date = new Date(n.completedAt).toLocaleString('es-CL')

        let blockedItemsHtml = ''
        if (isBlocked && Array.isArray(n?.blockedItems) && n.blockedItems.length > 0) {
          const blockedSummary = n.blockedItems
            .slice(0, 3)
            .map((item) => {
              const reason = item?.note ? ` (${item.note})` : ''
              return `- ${item?.title || 'Item bloqueado'}${reason}`
            })
            .join('<br/>')

          const extraCount = n.blockedItems.length > 3 ? `<br/>... y ${n.blockedItems.length - 3} item(es) mas` : ''
          blockedItemsHtml = `<br/><small><strong>Checklist bloqueado:</strong><br/>${blockedSummary}${extraCount}</small>`
        }

        return `<li style="list-style:none; margin: 0 0 10px 0; padding: 10px 12px; border-radius: 10px; background: ${cardBackground}; border: ${cardBorder};"><strong>${n.title}</strong><br/><small>${stateLabel} - ${date}</small>${blockedItemsHtml}</li>`
      })
      .join('')

    await Swal.fire({
      icon: 'success',
      title: 'Notificacion Tareas',
      html: `<ul style="text-align: left; padding: 0; margin: 0; max-height: 320px; overflow: auto;">${itemsHtml}</ul>`,
      confirmButtonText: 'Cerrar',
      ...swalThemeOptions
    })

    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      window.localStorage.setItem(notificationsStorageKey, JSON.stringify(next))
      return next
    })
  }

  const apartmentById = useMemo(() => new Map((apartments || []).map((apartment) => [normalizeId(apartment.id), apartment])), [apartments])
  const userById = useMemo(() => new Map((users || []).map((user) => [normalizeId(user.id), user])), [users])
  const statusById = useMemo(() => new Map((statuses || []).map((status) => [normalizeId(status.id), status])), [statuses])

    useEffect(() => {
    if (!Array.isArray(tasks) || tasks.length === 0) return

    const currentSnapshot = {}
    tasks.forEach((task) => {
      if (task?.id == null) return
      currentSnapshot[String(task.id)] = getTaskStatusKey(task, statusById)
    })

    let prevSnapshot = null
    try {
      const rawPrev = window.localStorage.getItem(taskSnapshotStorageKey)
      prevSnapshot = rawPrev ? JSON.parse(rawPrev) : null
    } catch {
      prevSnapshot = null
    }

    const trackedStates = new Set(['done', 'blocked'])
    const completedOrBlockedTasks = tasks.filter((task) => trackedStates.has(getTaskStatusKey(task, statusById)))

    // Primera carga: guarda snapshot y, si no hay historial aún, siembra tareas ya completadas.
    if (!prevSnapshot || typeof prevSnapshot !== 'object') {
      setNotifications((prev) => {
        if (Array.isArray(prev) && prev.length > 0) {
          return prev
        }

        if (completedOrBlockedTasks.length === 0) {
          return prev
        }

        const seeded = completedOrBlockedTasks
          .slice(0, 50)
          .map((task, index) => {
            const state = getTaskStatusKey(task, statusById)
            const blockedItems = state === 'blocked' ? getChecklistBlockedItems(task) : []
            return {
            id: `seed-${task.id}-${index}`,
            taskId: task.id,
            title: task.titulo || `Tarea ${task.id}`,
            completedAt: new Date().toISOString(),
            state,
            blockedItems,
            read: false
            }
          })

        window.localStorage.setItem(notificationsStorageKey, JSON.stringify(seeded))
        return seeded
      })

      window.localStorage.setItem(taskSnapshotStorageKey, JSON.stringify(currentSnapshot))
      return
    }

    const justCompleted = []

    tasks.forEach((task) => {
      if (task?.id == null) return
      const taskId = String(task.id)
      const prevStatus = prevSnapshot[taskId]
      const nextStatus = currentSnapshot[taskId]

      if (prevStatus !== nextStatus && trackedStates.has(nextStatus)) {
        const blockedItems = nextStatus === 'blocked' ? getChecklistBlockedItems(task) : []
        justCompleted.push({
          id: `${taskId}-${Date.now()}`,
          taskId: task.id,
          title: task.titulo || `Tarea ${task.id}`,
          completedAt: new Date().toISOString(),
          state: nextStatus,
          blockedItems,
          read: false
        })
      }
    })

    if (justCompleted.length > 0) {
      setNotifications((prev) => {
        const next = [...justCompleted, ...prev].slice(0, 50)
        window.localStorage.setItem(notificationsStorageKey, JSON.stringify(next))
        return next
      })
    }

    window.localStorage.setItem(taskSnapshotStorageKey, JSON.stringify(currentSnapshot))
  }, [notificationsStorageKey, taskSnapshotStorageKey, tasks, statusById])

  const visibleTasks = useMemo(() => {
    const normalizedQuery = normalizeTaskText(searchTerm)

    // Filtrar tareas por permisos del usuario
    const permittedTasks = filterTasksByPermissions(tasks || [])

    return permittedTasks
      .filter((task) => matchesPeriod(task, period))
      .filter((task) => {
        if (!normalizedQuery) return true

        const taskStatusKey = getTaskStatusKey(task, statusById)
        const apartmentLabel = getRecordLabel(apartmentById.get(normalizeId(getTaskApartmentId(task))), `Apto ${getTaskApartmentId(task) ?? ''}`)
        const userLabel = getRecordLabel(userById.get(normalizeId(getTaskAssignedUserId(task))), `Usuario ${getTaskAssignedUserId(task) ?? ''}`)

        return [
          task.titulo,
          task.descripcion,
          getTaskType(task),
          apartmentLabel,
          userLabel,
          STATUS_META[taskStatusKey]?.label || ''
        ]
          .some((item) => normalizeTaskText(item).includes(normalizedQuery))
      })
      .sort(sortByRecentDate)
  }, [apartmentById, period, searchTerm, statusById, tasks, userById])

  const statusSummary = useMemo(() => {
    const summary = { pending: 0, 'in-progress': 0, done: 0, blocked: 0 }

    visibleTasks.forEach((task) => {
      const key = getTaskStatusKey(task, statusById)
      summary[key] = (summary[key] || 0) + 1
    })

    return summary
  }, [statusById, visibleTasks])

  const chartData = useMemo(() => STATUS_ORDER.map((key) => ({ key, count: statusSummary[key] || 0, ...STATUS_META[key] })), [statusSummary])
  const recentTasks = visibleTasks.slice(0, 4)
  const totalTasks = visibleTasks.length
  const maxChartCount = Math.max(...chartData.map((item) => item.count), 1)

  const metricCards = [
    {
      title: 'Total Tareas',
      value: totalTasks,
      helper: totalTasks > 0 ? 'Vista activa' : 'Sin tareas',
      tone: 'blue',
      icon: ClipboardList
    },
    {
      title: 'Pendientes',
      value: statusSummary.pending,
      helper: `${totalTasks ? Math.round((statusSummary.pending / totalTasks) * 100) : 0}% del total`,
      tone: 'slate',
      icon: Clock3
    },
    {
      title: 'En Progreso',
      value: statusSummary['in-progress'],
      helper: `${totalTasks ? Math.round((statusSummary['in-progress'] / totalTasks) * 100) : 0}% del total`,
      tone: 'amber',
      icon: ArrowUpRight
    },
    {
      title: 'Completadas',
      value: statusSummary.done,
      helper: `${totalTasks ? Math.round((statusSummary.done / totalTasks) * 100) : 0}% del total`,
      tone: 'green',
      icon: CheckCircle2
    },
    {
      title: 'Bloqueadas',
      value: statusSummary.blocked,
      helper: `${totalTasks ? Math.round((statusSummary.blocked / totalTasks) * 100) : 0}% del total`,
      tone: 'rose',
      icon: ShieldAlert
    }
  ]

  return (
    <section className="home-dashboard">
      <header className="home-topbar">
        <div className="home-topbar-heading">
          <h1 className="home-title"> <CIcon icon={cilGraph} size="xxl" /> Dashboard</h1>
          <p className="home-subtitle">Resumen operativo de tareas y ocupación</p>
        </div>

        <div className="home-topbar-actions">
          <label className="home-search">
            <Search size={16} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar tarea o apto..."
              aria-label="Buscar tarea o apartamento"
            />
          </label>

          <button type="button" className="home-icon-button" aria-label="Notificaciones" onClick={handleNotificationsClick}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="home-notification-dot" />}
          </button>
        </div>
      </header>

      <div className="home-metrics-grid">
        {metricCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      <div className="home-content-grid">
        <article className="home-panel home-chart-panel">
          <div className="home-panel-head">
            <div>
              <h2 className="home-panel-title">Estado de Tareas</h2>
              <p className="home-panel-subtitle">Distribución de carga de trabajo actual</p>
            </div>

            <label className="home-period-select">
              <span className="sr-only">Filtrar período</span>
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>
          </div>

          {loading ? (
            <div className="home-loading">Cargando información del tablero...</div>
          ) : (
            <div className="home-chart" aria-label="Distribución de tareas">
              {chartData.map((item) => {
                const barHeight = item.count === 0 ? 8 : Math.max(10, (item.count / maxChartCount) * 100)

                return (
                  <div key={item.key} className="home-chart-item">
                    <div className="home-chart-bar-wrap">
                      <div
                        className="home-chart-bar"
                        style={{ height: `${barHeight}%`, backgroundColor: item.fill }}
                      >
                        <span className="home-chart-value">{item.count}</span>
                      </div>
                    </div>
                    <div className="home-chart-label">
                      <span className="home-chart-dot" style={{ backgroundColor: item.fill }} />
                      <span>{item.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </article>

        <aside className="home-panel home-recent-panel">
          <div className="home-panel-head home-recent-head">
            <div>
              <h2 className="home-panel-title">Tareas Recientes</h2>
            </div>
          </div>

          <div className="home-recent-list">
            {recentTasks.length === 0 ? (
              <div className="home-empty-state">
                <p>No hay tareas para mostrar.</p>
              </div>
            ) : (
              recentTasks.map((task) => {
                const statusKey = getTaskStatusKey(task, statusById)
                const statusMeta = STATUS_META[statusKey] || STATUS_META.pending
                const apartmentLabel = getRecordLabel(apartmentById.get(normalizeId(getTaskApartmentId(task))), `Apto ${getTaskApartmentId(task) ?? '-'}`)
                const userLabel = getRecordLabel(userById.get(normalizeId(getTaskAssignedUserId(task))), `Usuario ${getTaskAssignedUserId(task) ?? '-'}`)

                return (
                  <article key={task.id} className="home-recent-item">
                    <span className="home-recent-accent" style={{ backgroundColor: statusMeta.fill }} />
                    <div className="home-recent-body">
                      <div className="home-recent-row">
                        <div>
                          <h3 className="home-recent-title">{task.titulo || 'Tarea sin título'}</h3>
                          <p className="home-recent-meta">{apartmentLabel} · {userLabel}</p>
                        </div>
                        <span className="home-recent-status">{statusMeta.label.toUpperCase()}</span>
                      </div>
                      <div className="home-recent-footer">
                        <span>{formatDateLabel(getTaskDate(task))}</span>
                        <span>{getTaskDeadlineTime(task) || 'Sin hora'}</span>
                        <span>{getTaskType(task) || 'Sin tipo'}</span>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>

          <Link to="/tasks" className="home-view-all">
            Ver todas las tareas
          </Link>
        </aside>
      </div>
    </section>
  )
}
