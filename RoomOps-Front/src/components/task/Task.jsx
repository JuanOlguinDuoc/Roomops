import React, { useEffect, useMemo, useState } from 'react'
import { CCard, CCardHeader, CCardBody, CButton, CFormInput, CInputGroup, CInputGroupText, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CBadge, CAvatar, CPagination, CPaginationItem, CFormCheck } from '@coreui/react'
import { CircleCheckBig, CircleX, Building2, UserRound, BookmarkCheck, CalendarDays, ClipboardClock } from 'lucide-react'
import CIcon from '@coreui/icons-react'
import * as icon from '@coreui/icons';
import Swal from 'sweetalert2'
import './Task.css'
import '../users/users.css'
import { Navigate } from 'react-router-dom'
import { confirmAction } from '../../utils/alert'
import { showErrorToast, showSuccessToast } from '../../utils/toast'
import { isUserLoggedIn, isUserAdmin, isUserSupervisor, getAllApartments, getAllUsers, getCurrentUser } from '../../service/localStorage'
import {
  canViewAllTasks,
  canViewOwnTasks,
  canCreateTasks,
  canEditTasks,
  canEditOwnTasks,
  canDeleteTasks,
  canAssignTasks,
  canChangeTaskStatus,
  canViewUsers,
  isTaskOwner,
  filterTasksByPermissions,
  canEditSpecificTask
} from '../../service/permissions'
import { getTasks, createTask, updateTask, deleteTask } from '../../service/taskService'
import { getApartments } from '../../service/apartmentService'
import { getUsers } from '../../service/userService'
import { getStatuses } from '../../service/statusService'
import {
 getLocalTasks,
 createTaskLocal,
 updateTaskLocal,
 deleteTaskLocal,
 getCurrentTaskTimestamps,
 normalizeTimeValue,
 getPriorityByType,
 parseTaskFromResponse,
 getTaskApartmentId,
 getTaskAssignedUserId,
 getTaskStatusId,
 getTaskType,
 getTaskDate,
 getTaskDueTime,
 resolveTaskStatusIdFromChecklist,
 isTrabajadorUser
} from './TaskFunctions'
import { openCreateTaskModal, openEditTaskModal } from './TaskForm'
import { TaskDetailPanel } from '../taskDetail'



export default function Task() {
 // Control de acceso: usuarios autenticados que puedan ver tareas
 const isLoggedIn = isUserLoggedIn()
 const canViewAllTasksPermission = canViewAllTasks()
 const canViewOwnTasksPermission = canViewOwnTasks()
 const canAccess = canViewAllTasksPermission || canViewOwnTasksPermission

 if (!isLoggedIn) {
  return <Navigate to="/login?redirect=/tasks" replace />
 }

 if (!canAccess) {
  return <Navigate to="/" replace />
 }

 const [tasks, setTasks] = useState([])
 const [apartments, setApartments] = useState([])
 const [users, setUsers] = useState([])
 const [dates, setDates] = useState([])
 const [statuses, setStatuses] = useState([])
 const [loading, setLoading] = useState(false)
 const [searchTerm, setSearchTerm] = useState('')
 const [showFilters, setShowFilters] = useState(false)
 const [selectedApartment, setSelectedApartment] = useState('Todos')
 const [selectedStatus, setSelectedStatus] = useState('Todos')
 const [selectedType, setSelectedType] = useState('Todos')
 const [selectedAssignee, setSelectedAssignee] = useState("Todos")
 const [selectedDate, setSelectedDate] = useState("Todos")
 const [selectedTaskDetail, setSelectedTaskDetail] = useState(null)
 const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
 const getRowsPerPage = () => {
  if (typeof window === 'undefined') return 10

  const { innerWidth: width, innerHeight: height } = window
  if (width < 576) return height < 760 ? 5 : 6
  if (width < 992) return height < 820 ? 7 : 8
  return height < 820 ? 9 : 10
 }
 const [rowsPerPage, setRowsPerPage] = useState(getRowsPerPage)
 const [currentPage, setCurrentPage] = useState(1)

 useEffect(() => {
  refreshAll()
 }, [])

 useEffect(() => {
  const handleResize = () => {
   setRowsPerPage(getRowsPerPage())
  }

  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
 }, [])

 const normalizeSearchText = (value = '') => {
  return String(value)
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .toLowerCase()
   .trim()
 }

 const parseTaskFromResponse = (resp) => {
  if (!resp) return null
  return resp.tarea || resp.data?.tarea || resp.task || resp.data?.task || resp
 }

 const getTaskApartmentId = (task = {}) => task.apartmentId ?? task.apartamentoId ?? null
 const getTaskAssignedUserId = (task = {}) => task.assignedUserId ?? task.usuarioAsignadoId ?? null
 const getTaskStatusId = (task = {}) => task.statusId ?? task.estadoId ?? null
 const getTaskType = (task = {}) => task.tipo ?? task.type ?? ''
 const getTaskPriority = (task = {}) => task.prioridad ?? task.priority ?? ''
 const getTaskDate = (task = {}) => task.fecha ?? task.date ?? ''
 const getTaskDueTime = (task = {}) => {
  const raw = task.dueTime ?? task.due_time ?? task.dueDateTime ?? ''
  return normalizeTimeValue(raw)
 }

 const isTrabajadorUser = (user = {}) => {
  const roleValue = typeof user.role === 'object' ? (user.role?.name || user.role?.id || '') : (user.role || '')
  const normalized = String(roleValue).trim().toUpperCase()
  return normalized === 'TRABAJADOR' || normalized === 'WORKER'
 }

 const apartmentNameById = useMemo(() => {
  const map = new Map()
  apartments.forEach((apartment) => {
   if (apartment?.id != null) {
    map.set(Number(apartment.id), apartment.nombre || `Apartamento ${apartment.id}`)
   }
  })
  return map
 }, [apartments])

 const userNameById = useMemo(() => {
  const map = new Map()
  users.forEach((user) => {
   if (user?.id != null) {
    const fullName = `${user.firstName || user.nombre || ''} ${user.lastName || user.apellidos || ''}`.trim()
    map.set(Number(user.id), fullName || user.email || `Usuario ${user.id}`)
   }
  })
  return map
 }, [users])

 const statusNameById = useMemo(() => {
  const map = new Map()
  statuses.forEach((status) => {
   if (status?.id != null) {
    map.set(Number(status.id), status.nombre || `Estado ${status.id}`)
   }
  })
  return map
 }, [statuses])



 const getTaskStatusLabel = (task = {}) => {
  const id = getTaskStatusId(task)
  if (id == null) return 'Sin estado'
  return statusNameById.get(Number(id)) || `Estado #${id}`
 }

 const getStatusBadgeColor = (statusLabel = '') => {
  const normalized = normalizeSearchText(statusLabel)
  if (normalized.includes('complet') || normalized.includes('hecho')) return 'success'
  if (normalized.includes('progreso') || normalized.includes('curso')) return 'warning'
  if (normalized.includes('por hacer')) return 'info'
  if (normalized.includes('bloquead') || normalized.includes('cancel')) return 'danger'
  return 'info'
 }

 const getTypeColor = (typeLabel = '') => {
  const normalized = normalizeSearchText(typeLabel)
  if (normalized.includes('mantencion')) return '#dc3545'
  if (normalized.includes('aseo')) return '#f1f500'
  if (normalized.includes('repaso')) return '#00f5e1'
  return '#6c757d' // gris
 }

 const getDeadLine = (typeLabel = '') => {
  const normalized = normalizeSearchText(typeLabel)
  if (normalized.includes('mantencion')) return '15:00'
  if (normalized.includes('aseo')) return '16:00'
  if (normalized.includes('repaso')) return '16:00'
  return 'No Aplica' // gris
 }

 const getTaskSearchIndex = (task = {}) => {
  const apartmentId = getTaskApartmentId(task)
  const userId = getTaskAssignedUserId(task)
  const statusLabel = getTaskStatusLabel(task)
  const typeLabel = getTaskType(task)
  const dateLabel = getTaskDate(task)
  const priorityLabel = getTaskPriority(task)
  const apartmentName = apartmentId != null ? (apartmentNameById.get(Number(apartmentId)) || `Apartamento ${apartmentId}`) : 'Sin apartamento'
  const assigneeName = userId != null ? (userNameById.get(Number(userId)) || `Usuario ${userId}`) : 'Sin asignar'
  return normalizeSearchText(`${task.titulo || ''} ${task.descripcion || ''} ${typeLabel} ${dateLabel} ${priorityLabel} ${apartmentName} ${assigneeName} ${statusLabel}`)
 }

 const assigneeOptions = useMemo(() => {
  const sorted = [...users]
   .filter((assignee) => assignee?.id != null)
   .sort((a, b) => {
    const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim()
    const bName = `${a.firstName || ''} ${a.lastName || ''}`.trim()
    return aName.localeCompare(bName, 'es')
   })

  const formatted = sorted.map((user) => ({
   id: String(user.id),
   nombre: `${user.firstName || ''} ${user.lastName || ''}`.trim()
  }))

  return [{ id: 'Todos', nombre: 'Todos' }, ...formatted]
 }, [users])

 const dateOptions = useMemo(() => {
  const uniqueTypes = Array.from(
   new Set(
    tasks
     .map((task) => normalizeSearchText(getTaskDate(task)))
     .filter(Boolean)
   )
  )
  const formatted = uniqueTypes.map((date) => ({
   id: date,
   fecha: date
  }))
  return [{ id: 'Todos', fecha: 'Todos' }, ...formatted]
 }, [tasks])

 const apartmentOptions = useMemo(() => {
  const sorted = [...apartments]
   .filter((apartment) => apartment?.id != null)
   .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
  return [{ id: 'Todos', nombre: 'Todos' }, ...sorted]
 }, [apartments])

 const typeOptions = useMemo(() => {
  const uniqueTypes = Array.from(
   new Set(
    tasks
     .map((task) => normalizeSearchText(getTaskType(task)))
     .filter(Boolean)
   )
  )
  const formatted = uniqueTypes.map((type) => ({
   id: type,
   nombre: type.charAt(0).toUpperCase() + type.slice(1)
  }))

  return [{ id: 'Todos', nombre: 'Todos' }, ...formatted]
 }, [tasks])

 const statusOptions = useMemo(() => {
  const sorted = [...statuses]
   .filter((status) => status?.id != null)
   .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
  return [{ id: 'Todos', nombre: 'Todos' }, ...sorted]
 }, [statuses])

 const refreshAll = async () => {
  setLoading(true)

  // Para TRABAJADOR, no se llama a getUsers() porque el backend devuelve 403
  const usersFetch = canViewUsers() ? getUsers() : Promise.resolve([])

  // Cargamos datos en paralelo para que la tabla ya tenga mapeo de ids a etiquetas.
  const [tasksResult, apartmentsResult, usersResult, statusesResult] = await Promise.allSettled([
   getTasks(),
   getApartments(),
   usersFetch,
   getStatuses(),
   getTaskType()
  ])

  if (tasksResult.status === 'fulfilled') {
   setTasks(Array.isArray(tasksResult.value) ? tasksResult.value : [])
  } else {
   console.error('Error fetching tasks from API, using local fallback', tasksResult.reason)
   setTasks(getLocalTasks())
  }

  if (apartmentsResult.status === 'fulfilled') {
   setApartments(Array.isArray(apartmentsResult.value) ? apartmentsResult.value : [])
  } else {
   console.error('Error fetching apartments from API, using local fallback', apartmentsResult.reason)
   setApartments(getAllApartments())
  }

  if (usersResult.status === 'fulfilled') {
   setUsers(Array.isArray(usersResult.value) ? usersResult.value : [])
  } else {
   console.error('Error fetching users from API, using local fallback', usersResult.reason)
   setUsers(getAllUsers())
  }

  if (statusesResult.status === 'fulfilled') {
   setStatuses(Array.isArray(statusesResult.value) ? statusesResult.value : [])
  } else {
   console.error('Error fetching statuses from API', statusesResult.reason)
   setStatuses([])
  }

  setLoading(false)
 }

 const filteredTasks = useMemo(() => {
  const term = normalizeSearchText(searchTerm)

  // Primero, filtrar tareas por permisos del usuario
  let permittedTasks = filterTasksByPermissions(tasks)

  return permittedTasks.filter((task) => {
   const apartmentId = getTaskApartmentId(task)
   const statusId = getTaskStatusId(task)
   const typeId = normalizeSearchText(getTaskType(task))
   const assignedUserId = getTaskAssignedUserId(task)
   const dateId = normalizeSearchText(getTaskDate(task))

   const matchesDate = selectedDate === 'Todos' || dateId === selectedDate
   const matchesAssignee = selectedAssignee === 'Todos' || String(assignedUserId ?? '') === selectedAssignee
   const matchesSearch = !term || getTaskSearchIndex(task).includes(term)
   const matchesApartment = selectedApartment === 'Todos' || String(apartmentId ?? '') === selectedApartment
   const matchesStatus = selectedStatus === 'Todos' || String(statusId ?? '') === selectedStatus
   const matchesType = selectedType === 'Todos' || typeId === selectedType

   return matchesAssignee && matchesSearch && matchesApartment && matchesStatus && matchesType && matchesDate
  })
 }, [tasks, searchTerm, selectedDate, selectedAssignee, selectedApartment, selectedStatus, selectedType, apartmentNameById, userNameById, statusNameById])

 const totalPages = useMemo(() => {
  return Math.max(1, Math.ceil(filteredTasks.length / rowsPerPage))
 }, [filteredTasks.length, rowsPerPage])

 const paginatedTasks = useMemo(() => {
  const start = (currentPage - 1) * rowsPerPage
  return filteredTasks.slice(start, start + rowsPerPage)
 }, [filteredTasks, currentPage, rowsPerPage])

 const pageNumbers = useMemo(() => {
  const maxVisible = 5
  if (totalPages <= maxVisible) {
   return Array.from({ length: totalPages }, (_, idx) => idx + 1)
  }

  let start = Math.max(1, currentPage - 2)
  let end = Math.min(totalPages, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)

  return Array.from({ length: end - start + 1 }, (_, idx) => start + idx)
 }, [currentPage, totalPages])

 useEffect(() => {
  setCurrentPage(1)
 }, [searchTerm, selectedDate, selectedAssignee, selectedApartment, selectedStatus, selectedType, rowsPerPage])

 useEffect(() => {
  if (currentPage > totalPages) {
   setCurrentPage(totalPages)
  }
 }, [currentPage, totalPages])

 const clearFilters = () => {
  setSelectedApartment('Todos')
  setSelectedStatus('Todos')
  setSelectedType('Todos')
  setSelectedAssignee('Todos')
  setSelectedDate('Todos')
 }





 const handleViewTask = (task) => {
  setSelectedTaskDetail(task)
  setIsTaskDetailOpen(true)
 }

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
   await refreshAll()
   return true
  } catch (err) {
   console.error('Error updating checklist', err)
   const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error actualizando checklist'
   showErrorToast(msg)
   return false
  }
 }

 const handleCloseTaskDetail = () => {
  setIsTaskDetailOpen(false)
  setSelectedTaskDetail(null)
 }

 const handleDeleteTask = (task) => {
  const taskId = task.id
  const title = task.titulo || 'esta tarea'

  confirmAction({
   title: 'Eliminar tarea',
   text: `¿Eliminar ${title}?`,
   confirmText: 'Eliminar'
  }).then(async (ok) => {
   if (!ok) return

   try {
    try {
     await deleteTask(taskId)
    } catch (err) {
     const localResult = deleteTaskLocal(taskId)
     if (!localResult?.success) {
      throw new Error(localResult?.message || 'No se pudo eliminar la tarea en localStorage')
     }
     showErrorToast('Se uso copia local por falla del servidor')
    }

    showSuccessToast('Tarea eliminada')
    await refreshAll()
   } catch (err) {
    console.error('Error deleting task', err)
    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error eliminando tarea'
    showErrorToast(msg)
   }
  })
 }

 const handleStartCreate = async () => {
  try {
   const result = await openCreateTaskModal(apartments, users, statuses)
   if (!result?.isConfirmed || !result?.value) return

   try {
    await createTask(result.value)
   } catch (err) {
    const localResult = createTaskLocal(result.value)
    if (!localResult?.success) {
     throw new Error(localResult?.message || 'No se pudo crear la tarea en localStorage')
    }
    showErrorToast('Se uso copia local por falla del servidor')
   }

   showSuccessToast('Tarea creada')
   await refreshAll()
  } catch (err) {
   console.error('Error creating task', err)
   const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error creando tarea'
   showErrorToast(msg)
  }
 }

 const handleEditTask = async (task) => {
  try {
   const result = await openEditTaskModal(task, apartments, users, statuses)
   if (!result?.isConfirmed || !result?.value) return

   try {
    await updateTask(task.id, result.value)
   } catch (err) {
    const localResult = updateTaskLocal(task.id, result.value)
    if (!localResult?.success) {
     throw new Error(localResult?.message || 'No se pudo actualizar la tarea en localStorage')
    }
    showErrorToast('Se uso copia local por falla del servidor')
   }

   showSuccessToast('Tarea actualizada')
   await refreshAll()
  } catch (err) {
   console.error('Error updating task', err)
   const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error actualizando tarea'
   showErrorToast(msg)
  }
 }

 return (
  <div className="users-view container-fluid px-0">
   <CCard className="users-card mb-4 shadow-sm border-0">
    <CCardHeader className="bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
     <h4 className="mb-0 fw-bold">Gestion de Tareas</h4>
     {canCreateTasks() && (
      <CButton color="dark" className="d-flex align-items-center gap-2" onClick={handleStartCreate}>
       <CIcon icon={icon.cilPlus} /> Anadir Tarea
      </CButton>
     )}
    </CCardHeader>

    <CCardBody>
     <div className="users-toolbar d-flex justify-content-between mb-3">
      <CInputGroup className="users-search">
       <CInputGroupText className="bg-white">
        <CIcon icon={icon.cilSearch} />
       </CInputGroupText>
       <CFormInput
        placeholder="Buscar por titulo, apartamento, usuario o estado..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
       />
      </CInputGroup>

      <div className="d-flex gap-2">
       <CButton
        color="light"
        variant="outline"
        className="users-filter-btn text-dark border d-flex align-items-center gap-2"
        onClick={() => setShowFilters((prev) => !prev)}
       >
        <CIcon icon={icon.cilFilter} /> Filtrar
       </CButton>
      </div>
     </div>

     {showFilters && (
      <div className="d-flex flex-wrap gap-2 mb-3">
       <div>
        <label htmlFor="task-apartment-filter" className="form-label mb-1">Apartamento</label>
        <select
         id="task-apartment-filter"
         className="form-select"
         style={{ maxWidth: '250px' }}
         value={selectedApartment}
         onChange={(e) => setSelectedApartment(e.target.value)}
         aria-label="Filtrar por apartamento"
        >
         {apartmentOptions.map((apartment) => (
          <option key={apartment.id} value={String(apartment.id)}>{apartment.nombre}</option>
         ))}
        </select>
       </div>

       <div>
        <label htmlFor="task-type-filter" className="form-label mb-1">Tipo</label>
        <select
         id="task-type-filter"
         className="form-select"
         style={{ maxWidth: '250px' }}
         value={selectedType}
         onChange={(e) => setSelectedType(e.target.value)}
         aria-label="Filtrar por tipo"
        >
         {typeOptions.map((type) => (
          <option key={type.id} value={String(type.id)}>{type.nombre}</option>
         ))}
        </select>
       </div>

       <div>
        <label htmlFor="task-status-filter" className="form-label mb-1">Estado</label>
        <select
         id="task-status-filter"
         className="form-select"
         style={{ maxWidth: '250px' }}
         value={selectedStatus}
         onChange={(e) => setSelectedStatus(e.target.value)}
         aria-label="Filtrar por estado"
        >
         {statusOptions.map((status) => (
          <option key={status.id} value={String(status.id)}>{status.nombre}</option>
         ))}
        </select>
       </div>

       <div>
        <label htmlFor="task-date-filter" className="form-label mb-1">Fecha</label>
        <select
         id="task-date-filter"
         className="form-select"
         style={{ maxWidth: '250px' }}
         value={selectedDate}
         onChange={(e) => setSelectedDate(e.target.value)}
         aria-label="Filtrar por fecha"
        >
         {dateOptions.map((date) => (
          <option key={date.id} value={String(date.id)}>{date.fecha}</option>
         ))}
        </select>
       </div>

       <div>
        <label htmlFor="task-assignee-filter" className="form-label mb-1">Asignación</label>
        <select
         id="task-assignee-filter"
         className="form-select"
         style={{ maxWidth: '250px' }}
         value={selectedAssignee}
         onChange={(e) => setSelectedAssignee(e.target.value)}
         aria-label="Filtrar por persona asignada"
        >
         {assigneeOptions.map((user) => (
          <option key={user.id} value={String(user.id)}>{user.nombre}</option>
         ))}
        </select>
       </div>

       <div className="d-flex align-items-end">
        <CButton color="secondary" variant="outline" onClick={clearFilters}>
         Limpiar filtros
        </CButton>
       </div>
      </div>
     )}



     <div className="users-table-wrapper">
      <CTable align="middle" responsive hover className="users-table task-table border text-center mb-0">
       <CTableHead color="primary">
        <CTableRow>
         <CTableHeaderCell className="text-start d-none d-sm-table-cell" style={{ width: '40px' }}>
          <CFormCheck />
         </CTableHeaderCell>
         <CTableHeaderCell className="text-start">Tarea</CTableHeaderCell>
         <CTableHeaderCell className="d-none d-md-table-cell">Apartamento</CTableHeaderCell>
         <CTableHeaderCell className="d-none d-lg-table-cell">Asignado</CTableHeaderCell>
         <CTableHeaderCell className='d-none d-lg-table-cell'>Fecha</CTableHeaderCell>
         <CTableHeaderCell className='d-none d-lg-table-cell'>Hora Limite</CTableHeaderCell>
         <CTableHeaderCell className='d-none d-lg-table-cell'>Tipo</CTableHeaderCell>
         <CTableHeaderCell>Estado</CTableHeaderCell>
         {(canEditTasks() || canDeleteTasks() || canChangeTaskStatus()) && <CTableHeaderCell className="d-none d-sm-table-cell">Acciones</CTableHeaderCell>}
        </CTableRow>
       </CTableHead>

       <CTableBody>
        {paginatedTasks.map((task) => {
         const apartmentId = getTaskApartmentId(task)
         const assignedUserId = getTaskAssignedUserId(task)
         const statusLabel = getTaskStatusLabel(task)
         const apartmentName = apartmentId != null ? (apartmentNameById.get(Number(apartmentId)) || `Apartamento ${apartmentId}`) : 'Sin apartamento'
         const assigneeName = assignedUserId != null ? (userNameById.get(Number(assignedUserId)) || `Usuario ${assignedUserId}`) : 'Sin asignar'
         const typeLabel = getTaskType(task)
         const dateLabel = getTaskDate(task)

         return (
          <CTableRow key={task.id}>
           <CTableDataCell className="text-start d-none d-sm-table-cell">
            <CFormCheck id={`check-task-${task.id}`} />
           </CTableDataCell>

           <CTableDataCell className="text-start">
            <div className="d-flex align-items-center gap-3">
             <CAvatar color="primary" textColor="white" size="md">T</CAvatar>
             <div>
              <div className="fw-semibold">{task.titulo || 'Sin titulo'}</div>
              <div className="small text-secondary text-truncate task-description-cell">{task.descripcion || 'Sin descripcion'}</div>
             </div>
            </div>
           </CTableDataCell>

           <CTableDataCell className="d-none d-md-table-cell">
            <span className="fw-medium d-inline-flex align-items-center gap-1">
             <Building2 size={20} /> {apartmentName}
            </span>
           </CTableDataCell>

           <CTableDataCell className="d-none d-lg-table-cell">
            <span className="fw-medium d-inline-flex align-items-center gap-1">
             <UserRound size={20} /> {assigneeName}
            </span>
           </CTableDataCell>

           <CTableDataCell className="d-none d-lg-table-cell">
            <span className="fw-medium d-inline-flex align-items-center gap-1">
             <CalendarDays size={20} /> {dateLabel}
            </span>
           </CTableDataCell>

           <CTableDataCell className="d-none d-lg-table-cell">
            <span className="fw-medium d-inline-flex align-items-center gap-1">
             <ClipboardClock size={20} /> {getDeadLine(typeLabel)}
            </span>
           </CTableDataCell>

           <CTableDataCell className="d-none d-lg-table-cell">
            <span className="fw-medium d-inline-flex align-items-center gap-1">
             <BookmarkCheck
              color={getTypeColor(typeLabel)}
              size={20} /> {typeLabel}
            </span>
           </CTableDataCell>

           <CTableDataCell>
            <div className="d-flex align-items-center justify-content-center gap-2">
             <CBadge
              color={getStatusBadgeColor(statusLabel)}
              shape="rounded-pill"
              className="px-3 py-2 d-inline-flex align-items-center gap-1"
             >
              {getStatusBadgeColor(statusLabel) === 'success'
               ? <CircleCheckBig size={20} />
               : <CircleX size={20} />}
              {statusLabel}
             </CBadge>
            </div>
           </CTableDataCell>

           {(canEditSpecificTask(task) || canDeleteTasks() || canChangeTaskStatus()) && (
            <CTableDataCell className="d-none d-sm-table-cell">
             <div className="users-actions d-flex justify-content-center gap-2">
              {canEditSpecificTask(task) && (
               <CButton
                color="info"
                variant="outline"
                className="users-action-btn"
                title="Editar tarea"
                aria-label={`Editar tarea ${task.titulo || 'tarea'}`}
                onClick={() => void handleEditTask(task)}
               >
                <CIcon icon={icon.cilPencil} size="sm" />
               </CButton>
              )}
              <CButton
               color="success"
               variant="outline"
               className="users-action-btn"
               title="Ver detalle"
               aria-label={`Detalle tarea ${task.titulo || 'tarea'}`}
               onClick={() => handleViewTask(task)}
              >
               <CIcon icon={icon.cilZoom} size="sm" />
              </CButton>
              {canDeleteTasks() && (
               <CButton
                color="danger"
                className="users-action-btn users-action-btn-danger"
                title="Eliminar tarea"
                aria-label={`Eliminar tarea ${task.titulo || 'tarea'}`}
                onClick={() => handleDeleteTask(task)}
               >
                <CIcon icon={icon.cilTrash} size="sm" />
               </CButton>
              )}
             </div>
            </CTableDataCell>
           )}
          </CTableRow>
         )
        })}
       </CTableBody>
      </CTable>
     </div>

     <div className="users-footer d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
      <div className="small text-secondary">
       {loading
        ? 'Cargando tareas...'
        : `Mostrando ${paginatedTasks.length} de ${filteredTasks.length} tareas (pagina ${currentPage}/${totalPages})`}
      </div>
      <CPagination aria-label="Paginacion de tareas" className="mb-0" style={{ cursor: 'pointer' }}>
       <CPaginationItem disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>Anterior</CPaginationItem>
       {pageNumbers.map((page) => (
        <CPaginationItem
         key={`task-page-${page}`}
         active={page === currentPage}
         onClick={() => setCurrentPage(page)}
        >
         {page}
        </CPaginationItem>
       ))}
       <CPaginationItem disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>Siguiente</CPaginationItem>
      </CPagination>
     </div>
    </CCardBody>
   </CCard>

    <TaskDetailPanel
     isOpen={isTaskDetailOpen}
     task={selectedTaskDetail}
     onClose={handleCloseTaskDetail}
     apartmentNameById={apartmentNameById}
     userNameById={userNameById}
     statusNameById={statusNameById}
     getDeadLine={getDeadLine}
     onSaveChecklist={handleSaveTaskChecklist}
    />
  </div>
 )
}
