/**
 * Sistema centralizado de permisos basado en roles
 * Define qué puede hacer cada rol en el sistema
 */

import { isUserAdmin, isUserSupervisor, isUserTrabajador, getCurrentUser } from './localStorage'

// Definición de roles
export const ROLES = {
  ADMIN: 'ADMIN',
  ADMINISTRADOR: 'ADMINISTRADOR',
  SUPERVISOR: 'SUPERVISOR',
  TRABAJADOR: 'TRABAJADOR'
}

// Definición de acciones/permisos
export const PERMISSIONS = {
  // USUARIOS
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  CHANGE_USER_ROLE: 'change_user_role',

  // APARTAMENTOS
  VIEW_APARTMENTS: 'view_apartments',
  CREATE_APARTMENT: 'create_apartment',
  EDIT_APARTMENT: 'edit_apartment',
  DELETE_APARTMENT: 'delete_apartment',

  // TAREAS
  VIEW_ALL_TASKS: 'view_all_tasks',
  VIEW_OWN_TASKS: 'view_own_tasks',
  CREATE_TASK: 'create_task',
  EDIT_TASK: 'edit_task',
  EDIT_OWN_TASK: 'edit_own_task',
  DELETE_TASK: 'delete_task',
  ASSIGN_TASK: 'assign_task',
  CHANGE_TASK_STATUS: 'change_task_status',

  // CHECKLIST
  VIEW_CHECKLIST: 'view_checklist',
  EDIT_CHECKLIST: 'edit_checklist',

  // DASHBOARD Y REPORTS
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  VIEW_REPORTS: 'view_reports',

  // KANBAN
  VIEW_KANBAN: 'view_kanban',
  VIEW_PERSONAL_KANBAN: 'view_personal_kanban',

  // CONFIGURACIÓN
  ACCESS_SETTINGS: 'access_settings',
  MANAGE_PERMISSIONS: 'manage_permissions'
}

// Matriz de permisos: Qué rol tiene qué permiso
const rolePermissions = {
  [ROLES.ADMIN]: [
    // Usuarios - ADMIN puede todo
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.CHANGE_USER_ROLE,

    // Apartamentos - ADMIN puede todo
    PERMISSIONS.VIEW_APARTMENTS,
    PERMISSIONS.CREATE_APARTMENT,
    PERMISSIONS.EDIT_APARTMENT,
    PERMISSIONS.DELETE_APARTMENT,

    // Tareas - ADMIN puede todo
    PERMISSIONS.VIEW_ALL_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.EDIT_OWN_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.CHANGE_TASK_STATUS,

    // Checklist
    PERMISSIONS.VIEW_CHECKLIST,
    PERMISSIONS.EDIT_CHECKLIST,

    // Dashboard y reports
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,

    // Kanban
    PERMISSIONS.VIEW_KANBAN,
    PERMISSIONS.VIEW_PERSONAL_KANBAN,

    // Configuración
    PERMISSIONS.ACCESS_SETTINGS,
    PERMISSIONS.MANAGE_PERMISSIONS
  ],

  [ROLES.ADMINISTRADOR]: [
    // Usuarios - ADMINISTRADOR puede todo
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.CHANGE_USER_ROLE,

    // Apartamentos - ADMINISTRADOR puede todo
    PERMISSIONS.VIEW_APARTMENTS,
    PERMISSIONS.CREATE_APARTMENT,
    PERMISSIONS.EDIT_APARTMENT,
    PERMISSIONS.DELETE_APARTMENT,

    // Tareas - ADMINISTRADOR puede todo
    PERMISSIONS.VIEW_ALL_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.EDIT_OWN_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.CHANGE_TASK_STATUS,

    // Checklist
    PERMISSIONS.VIEW_CHECKLIST,
    PERMISSIONS.EDIT_CHECKLIST,

    // Dashboard y reports
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,

    // Kanban
    PERMISSIONS.VIEW_KANBAN,
    PERMISSIONS.VIEW_PERSONAL_KANBAN,

    // Configuración
    PERMISSIONS.ACCESS_SETTINGS,
    PERMISSIONS.MANAGE_PERMISSIONS
  ],

  [ROLES.SUPERVISOR]: [
    // Usuarios - SUPERVISOR puede VER usuarios (lectura solamente)
    PERMISSIONS.VIEW_USERS,

    // Apartamentos - SI puede ver apartamentos
    PERMISSIONS.VIEW_APARTMENTS,

    // Tareas - SUPERVISOR puede ver todas, crear, editar, asignar
    PERMISSIONS.VIEW_ALL_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.EDIT_OWN_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.CHANGE_TASK_STATUS,

    // Checklist
    PERMISSIONS.VIEW_CHECKLIST,
    PERMISSIONS.EDIT_CHECKLIST,

    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_KANBAN,
    PERMISSIONS.VIEW_PERSONAL_KANBAN
  ],

  [ROLES.TRABAJADOR]: [
    // Tareas - TRABAJADOR solo ve sus tareas
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.CHANGE_TASK_STATUS,

    // Checklist
    PERMISSIONS.VIEW_CHECKLIST,
    PERMISSIONS.EDIT_CHECKLIST,

    // Kanban personal
    PERMISSIONS.VIEW_PERSONAL_KANBAN
  ]
}

/**
 * Obtiene el rol actual del usuario
 * @returns {string} El rol del usuario actual (ADMIN, SUPERVISOR, TRABAJADOR, etc.)
 */
export const getCurrentUserRole = () => {
  if (isUserAdmin()) return ROLES.ADMIN
  if (isUserSupervisor()) return ROLES.SUPERVISOR
  if (isUserTrabajador()) return ROLES.TRABAJADOR
  return null
}

/**
 * Verifica si el usuario actual tiene un permiso específico
 * @param {string} permission - El permiso a verificar
 * @returns {boolean} true si tiene el permiso, false en caso contrario
 */
export const hasPermission = (permission) => {
  const role = getCurrentUserRole()
  if (!role) return false
  return rolePermissions[role]?.includes(permission) || false
}

/**
 * Verifica si el usuario tiene ALGUNO de los permisos listados
 * @param {string[]} permissions - Array de permisos a verificar
 * @returns {boolean} true si tiene al menos uno de los permisos
 */
export const hasAnyPermission = (permissions) => {
  return permissions.some(permission => hasPermission(permission))
}

/**
 * Verifica si el usuario tiene TODOS los permisos listados
 * @param {string[]} permissions - Array de permisos a verificar
 * @returns {boolean} true si tiene todos los permisos
 */
export const hasAllPermissions = (permissions) => {
  return permissions.every(permission => hasPermission(permission))
}

/**
 * Obtiene todos los permisos del usuario actual
 * @returns {string[]} Array de permisos
 */
export const getUserPermissions = () => {
  const role = getCurrentUserRole()
  if (!role) return []
  return rolePermissions[role] || []
}

/**
 * Verifica si el usuario puede ver la vista de Usuarios
 */
export const canViewUsers = () => hasPermission(PERMISSIONS.VIEW_USERS)

/**
 * Verifica si el usuario puede gestionar usuarios
 */
export const canManageUsers = () => hasPermission(PERMISSIONS.CREATE_USER)

/**
 * Verifica si el usuario puede ver apartamentos
 */
export const canViewApartments = () => hasPermission(PERMISSIONS.VIEW_APARTMENTS)

/**
 * Verifica si el usuario puede gestionar apartamentos
 */
export const canManageApartments = () => hasPermission(PERMISSIONS.CREATE_APARTMENT)

/**
 * Verifica si el usuario puede ver todas las tareas
 */
export const canViewAllTasks = () => hasPermission(PERMISSIONS.VIEW_ALL_TASKS)

/**
 * Verifica si el usuario puede ver sus propias tareas
 */
export const canViewOwnTasks = () => {
  // Fallback temporal: si hay sesión activa, al menos puede ver su vista personal de tareas.
  // Esto evita bloqueos cuando el rol llega en un formato no normalizado desde backend.
  return hasPermission(PERMISSIONS.VIEW_OWN_TASKS) || !!getCurrentUser()
}

/**
 * Verifica si el usuario puede crear tareas
 */
export const canCreateTasks = () => hasPermission(PERMISSIONS.CREATE_TASK)

/**
 * Verifica si el usuario puede editar tareas
 */
export const canEditTasks = () => hasPermission(PERMISSIONS.EDIT_TASK)

/**
 * Verifica si el usuario puede editar solo sus propias tareas
 */
export const canEditOwnTasks = () => hasPermission(PERMISSIONS.EDIT_OWN_TASK)

/**
 * Verifica si el usuario puede eliminar tareas
 */
export const canDeleteTasks = () => hasPermission(PERMISSIONS.DELETE_TASK)

/**
 * Verifica si el usuario puede asignar tareas
 */
export const canAssignTasks = () => hasPermission(PERMISSIONS.ASSIGN_TASK)

/**
 * Verifica si el usuario puede cambiar el estado de tareas
 */
export const canChangeTaskStatus = () => hasPermission(PERMISSIONS.CHANGE_TASK_STATUS)

/**
 * Verifica si el usuario puede ver y editar checklist
 */
export const canManageChecklist = () => hasPermission(PERMISSIONS.EDIT_CHECKLIST)

/**
 * Verifica si el usuario puede ver el dashboard administrativo
 */
export const canViewAdminDashboard = () => hasPermission(PERMISSIONS.VIEW_ADMIN_DASHBOARD)

/**
 * Verifica si el usuario puede ver reportes
 */
export const canViewReports = () => hasPermission(PERMISSIONS.VIEW_REPORTS)

/**
 * Verifica si el usuario puede ver kanban
 */
export const canViewKanban = () => hasPermission(PERMISSIONS.VIEW_KANBAN)

/**
 * Verifica si el usuario puede ver kanban personal
 */
export const canViewPersonalKanban = () => {
  // Mismo criterio que tareas personales para evitar menú vacío en usuarios operativos.
  return hasPermission(PERMISSIONS.VIEW_PERSONAL_KANBAN) || !!getCurrentUser()
}

/**
 * Verifica si el usuario puede acceder a configuración
 */
export const canAccessSettings = () => hasPermission(PERMISSIONS.ACCESS_SETTINGS)

/**
 * Verifica si una tarea pertenece al usuario actual
 * @param {object} task - La tarea a verificar
 * @returns {boolean} true si la tarea está asignada al usuario actual
 */
export const isTaskOwner = (task) => {
  const currentUser = getCurrentUser()
  if (!currentUser) return false

  const currentUserId = currentUser?.id != null ? String(currentUser.id) : null
  const currentUserEmail = String(currentUser?.email || '').toLowerCase()

  // Buscar si el usuario está en los asignados
  if (task.assignedUsers && Array.isArray(task.assignedUsers)) {
    return task.assignedUsers.some((u) => {
      const assignedId = u?.id != null ? String(u.id) : null
      const assignedEmail = String(u?.email || '').toLowerCase()
      return (assignedId && currentUserId && assignedId === currentUserId)
        || (assignedEmail && currentUserEmail && assignedEmail === currentUserEmail)
    })
  }

  // Alternativas comunes del backend para asignación de usuario
  const assignedUserId = task?.assignedUserId != null
    ? String(task.assignedUserId)
    : (task?.usuarioAsignadoId != null ? String(task.usuarioAsignadoId) : null)

  const assignedUserEmail = String(
    task?.assignedUser?.email
      || task?.usuarioAsignado?.email
      || ''
  ).toLowerCase()

  if ((assignedUserId && currentUserId && assignedUserId === currentUserId)
    || (assignedUserId && currentUserEmail && assignedUserId.toLowerCase() === currentUserEmail)
    || (assignedUserEmail && currentUserEmail && assignedUserEmail === currentUserEmail)) {
    return true
  }

  return false
}

/**
 * Filtra tareas según lo que el usuario puede ver
 * @param {array} tasks - Array de tareas a filtrar
 * @returns {array} Array de tareas filtradas según permisos
 */
export const filterTasksByPermissions = (tasks) => {
  if (!Array.isArray(tasks)) return []

  // Los admins y supervisores ven todas las tareas
  if (canViewAllTasks()) {
    return tasks
  }

  // Los trabajadores solo ven sus tareas
  if (canViewOwnTasks()) {
    return tasks.filter(task => isTaskOwner(task))
  }

  return []
}

/**
 * Verifica si el usuario puede editar una tarea específica
 * @param {object} task - La tarea a verificar
 * @returns {boolean} true si puede editarla
 */
export const canEditSpecificTask = (task) => {
  // Admin/Supervisor pueden editar cualquier tarea
  if (canEditTasks()) {
    return true
  }

  // Trabajadores solo pueden editar sus propias tareas (si el permiso lo permite)
  if (canEditOwnTasks() && isTaskOwner(task)) {
    return true
  }

  return false
}

/**
 * Verifica si el usuario puede eliminar una tarea específica
 * @param {object} task - La tarea a verificar
 * @returns {boolean} true si puede eliminarla
 */
export const canDeleteSpecificTask = (task) => {
  // Solo admin/supervisor pueden eliminar
  return canDeleteTasks()
}

/**
 * Verifica si el usuario puede ver CUALQUIER tarea (propias o todas)
 * Usado para mostrar la sección de tareas en el sidebar
 */
export const canViewAnyTasks = () => {
  return canViewAllTasks() || canViewOwnTasks()
}

/**
 * Verifica si el usuario puede ver el kanban (completo o personal)
 * Usado para mostrar la sección de kanban en el sidebar
 */
export const canViewAnyKanban = () => {
  return canViewKanban() || canViewPersonalKanban()
}

export default {
  ROLES,
  PERMISSIONS,
  getCurrentUserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canViewUsers,
  canManageUsers,
  canViewApartments,
  canManageApartments,
  canViewAllTasks,
  canViewOwnTasks,
  canCreateTasks,
  canEditTasks,
  canEditOwnTasks,
  canDeleteTasks,
  canAssignTasks,
  canChangeTaskStatus,
  canManageChecklist,
  canViewAdminDashboard,
  canViewReports,
  canViewKanban,
  canViewPersonalKanban,
  canAccessSettings,
  isTaskOwner,
  filterTasksByPermissions,
  canEditSpecificTask,
  canDeleteSpecificTask,
  canViewAnyTasks,
  canViewAnyKanban
}
