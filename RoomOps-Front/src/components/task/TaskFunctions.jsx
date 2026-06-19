// Helpers y almacenamiento local para tareas
export const LOCAL_TASKS_KEY = 'tasks'
export const LOCAL_TASKS_NEXT_ID_KEY = 'nextTaskId'

export const getLocalTasks = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_TASKS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

export const saveLocalTasks = (tasks) => {
  localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks))
}

export const getNextLocalTaskId = () => {
  const current = Number(localStorage.getItem(LOCAL_TASKS_NEXT_ID_KEY) || '0')
  const next = current + 1
  localStorage.setItem(LOCAL_TASKS_NEXT_ID_KEY, String(next))
  return next
}

export const getCurrentTaskTimestamps = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return {
    fecha: `${year}-${month}-${day}`,
    dueTime: `${hours}:${minutes}`
  }
}

export const normalizeTaskText = (value = '') => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export const normalizeTimeValue = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const timePart = raw.includes('T') ? raw.split('T')[1] : raw
  const parts = timePart.split(':')
  if (parts.length < 2) return ''
  return `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`
}

export const getPriorityByType = (type = '') => {
  const normalized = String(type || '').trim().toLowerCase()
  if (normalized === 'mantencion') return 'ALTA'
  if (normalized === 'aseo') return 'MEDIA'
  if (normalized === 'repaso') return 'BAJA'
  return ''
}

export const createTaskLocal = (payload) => {
  const tasks = getLocalTasks()
  if (!payload?.titulo?.trim()) {
    return { success: false, message: 'El titulo es obligatorio' }
  }

  const autoTimestamps = getCurrentTaskTimestamps()

  const newTask = {
    id: getNextLocalTaskId(),
    titulo: payload.titulo.trim(),
    descripcion: payload.descripcion?.trim() || '',
    tipo: payload.tipo?.trim() || '',
    prioridad: payload.prioridad?.trim() || '',
    fecha: payload.fecha || autoTimestamps.fecha,
    dueTime: payload.dueTime || autoTimestamps.dueTime,
    apartmentId: payload.apartmentId != null ? Number(payload.apartmentId) : null,
    assignedUserId: payload.assignedUserId != null ? Number(payload.assignedUserId) : null,
    statusId: payload.statusId != null ? Number(payload.statusId) : null,
    checklist: payload.checklist || []
  }

  tasks.push(newTask)
  saveLocalTasks(tasks)
  return { success: true, task: newTask }
}

export const updateTaskLocal = (id, payload) => {
  const taskId = Number(id)
  const tasks = getLocalTasks()
  const idx = tasks.findIndex((task) => Number(task.id) === taskId)

  if (idx === -1) {
    return { success: false, message: 'Tarea no encontrada' }
  }

  tasks[idx] = {
    ...tasks[idx],
    titulo: payload.titulo?.trim() || tasks[idx].titulo,
    descripcion: payload.descripcion?.trim() || '',
    tipo: payload.tipo?.trim() || '',
    prioridad: payload.prioridad?.trim() || '',
    fecha: payload.fecha || null,
    dueTime: payload.dueTime || null,
    apartmentId: payload.apartmentId != null ? Number(payload.apartmentId) : null,
    assignedUserId: payload.assignedUserId != null ? Number(payload.assignedUserId) : null,
    statusId: payload.statusId != null ? Number(payload.statusId) : null,
    estadoId: payload.estadoId != null ? Number(payload.estadoId) : (payload.statusId != null ? Number(payload.statusId) : null),
    checklist: Array.isArray(payload.checklist) ? payload.checklist : tasks[idx].checklist
  }

  saveLocalTasks(tasks)
  return { success: true, task: tasks[idx] }
}

export const deleteTaskLocal = (id) => {
  const taskId = Number(id)
  const tasks = getLocalTasks()
  const updated = tasks.filter((task) => Number(task.id) !== taskId)

  if (updated.length === tasks.length) {
    return { success: false, message: 'Tarea no encontrada' }
  }

  saveLocalTasks(updated)
  return { success: true }
}

// parse helpers + small getters
export const parseTaskFromResponse = (resp) => {
  if (!resp) return null
  return resp.tarea || resp.data?.tarea || resp.task || resp.data?.task || resp
}

export const getTaskApartmentId = (task = {}) => task.apartmentId ?? task.apartamentoId ?? null
export const getTaskAssignedUserId = (task = {}) => task.assignedUserId ?? task.usuarioAsignadoId ?? null
export const getTaskStatusId = (task = {}) => task.statusId ?? task.estadoId ?? null
export const getTaskType = (task = {}) => task.tipo ?? task.type ?? ''
export const getTaskPriority = (task = {}) => task.prioridad ?? task.priority ?? ''
export const getTaskDate = (task = {}) => task.fecha ?? task.date ?? ''
export const getTaskDueTime = (task = {}) => {
  const raw = task.dueTime ?? task.due_time ?? task.dueDateTime ?? ''
  return normalizeTimeValue(raw)
}

export const getChecklistOverallStatusKey = (checklist = []) => {
  const items = Array.isArray(checklist) ? checklist : []
  if (items.length === 0) return 'pending'

  const normalizedStates = items.map((item) => normalizeTaskText(item?.estado || item?.status || item?.checklistStatus || item?.estadoChecklist || ''))

  if (normalizedStates.some((state) => state.includes('bloquead') || state.includes('blocked'))) {
    return 'blocked'
  }

  if (normalizedStates.every((state) => state.includes('hecho') || state.includes('complet') || state === 'done')) {
    return 'done'
  }

  if (normalizedStates.some((state) => state.includes('hecho') || state.includes('complet') || state === 'done')) {
    return 'in-progress'
  }

  return 'pending'
}

export const resolveTaskStatusIdFromChecklist = (statuses = [], checklist = [], fallbackStatusId = null) => {
  const targetKey = getChecklistOverallStatusKey(checklist)
  const matcherByKey = {
    blocked: (label) => label.includes('bloque'),
    done: (label) => label.includes('hecho') || label.includes('complet'),
    'in-progress': (label) => label.includes('progreso') || label.includes('curso'),
    pending: (label) => label.includes('pendiente') || label.includes('por hacer')
  }

  const matcher = matcherByKey[targetKey]
  const matchedStatus = Array.isArray(statuses)
    ? statuses.find((status) => {
      const normalizedLabel = normalizeTaskText(status?.nombre || status?.name || '')
      return matcher?.(normalizedLabel)
    })
    : null

  return matchedStatus?.id != null ? Number(matchedStatus.id) : fallbackStatusId
}

export const isTrabajadorUser = (user = {}) => {
  const roleValue = typeof user.role === 'object' ? (user.role?.name || user.role?.id || '') : (user.role || '')
  const normalized = String(roleValue).trim().toUpperCase()
  return normalized === 'TRABAJADOR' || normalized === 'WORKER'
}
