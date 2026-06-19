import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CAvatar,
  CPagination,
  CPaginationItem,
  CFormCheck
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilFilter, cilPlus, cilPencil, cilSwapHorizontal, cilCheckCircle, cilBan } from '@coreui/icons'
import Swal from 'sweetalert2'
import './users.css'
import { Navigate } from 'react-router-dom'
import { confirmAction } from '../../utils/alert'
import { showErrorToast, showSuccessToast } from '../../utils/toast'
import {
  getAllUsers, createUserAdmin, updateUserAdmin,
  isUserLoggedIn, isUserAdmin, isUserSupervisor
} from '../../service/localStorage'
import {
  canViewUsers,
  canManageUsers
} from '../../service/permissions'
import { getUsers, createUser, updateUser, updateUserEstado } from '../../service/userService'

export default function Users() {
  // Control de acceso: solo usuarios que puedan ver usuarios
  const isLoggedIn = isUserLoggedIn()
  const canAccess = canViewUsers()

  // Si no está logueado, redirigir al login
  if (!isLoggedIn) {
    return <Navigate to="/login?redirect=/users" replace />
  }

  // Si está logueado pero no tiene permisos, redirigir sin toast durante render
  if (!canAccess) {
    return <Navigate to="/" replace />
  }

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRole, setSelectedRole] = useState('Todos')
  const [selectedStatus, setSelectedStatus] = useState('Todos')
  const getRowsPerPage = () => {
    if (typeof window === 'undefined') return 10

    const { innerWidth: width, innerHeight: height } = window
    if (width < 576) return height < 760 ? 5 : 6
    if (width < 992) return height < 820 ? 7 : 8
    return height < 820 ? 9 : 10
  }
  const [rowsPerPage, setRowsPerPage] = useState(getRowsPerPage)
  const [currentPage, setCurrentPage] = useState(1)

  // El formulario usa la forma del backend (run, firstName, lastName, email, password, role).
  const [nuevoUser, setNuevoUser] = useState({ run: '', firstName: '', lastName: '', email: '', password: '', role: '' })

  // Cargar usuarios al montar la vista.
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

  const getUserSearchIndex = (user = {}) => {
    const firstName = user.firstName || user.nombre || user.name || ''
    const lastName = user.lastName || user.apellidos || user.apellido || ''
    const fullName = user.fullName || `${firstName} ${lastName}`
    const email = user.email || user.correo || ''
    const run = user.run || user.rut || ''

    return normalizeSearchText(`${firstName} ${lastName} ${fullName} ${email} ${run}`)
  }

  const resolveUserRole = (user = {}) => {
    const roleValue = typeof user.role === 'object' ? (user.role?.name || user.role?.id || '') : (user.role || '')
    const normalizedRole = String(roleValue).trim().toUpperCase()

    if (normalizedRole === 'ADMINISTRADOR' || normalizedRole === 'ADMIN') return 'Administrador'
    if (normalizedRole === 'SUPERVISOR') return 'Supervisor'
    if (normalizedRole === 'TRABAJADOR' || normalizedRole === 'WORKER') return 'Trabajador'
    return 'Sin rol'
  }

  const filteredUsers = useMemo(() => {
    const term = normalizeSearchText(searchTerm)

    return users.filter((user) => {
      const matchesSearch = !term || getUserSearchIndex(user).includes(term)
      const matchesRole = selectedRole === 'Todos' || resolveUserRole(user) === selectedRole
      const matchesStatus = selectedStatus === 'Todos' || resolveUserStatus(user) === selectedStatus
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, selectedRole, selectedStatus])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage))
  }, [filteredUsers.length, rowsPerPage])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredUsers.slice(start, start + rowsPerPage)
  }, [filteredUsers, currentPage, rowsPerPage])

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
  }, [searchTerm, selectedRole, selectedStatus, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const refreshAll = async () => {
    setLoading(true)
    // Estrategia híbrida: primero intentamos backend, si falla usamos localStorage.
    try {
      const usersFromApi = await getUsers()
      setUsers(Array.isArray(usersFromApi) ? usersFromApi : [])
    } catch (err) {
      console.error('Error fetching users from API, falling back to localStorage', err)
      setUsers(getAllUsers())
    } finally {
      setLoading(false)
    }
  }

  const formatRun = (value = '') => {
    const cleaned = String(value).replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9)
    if (cleaned.length <= 1) return cleaned
    return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`
  }

  const getApiErrorMessage = (err) => {
    const backendError = err?.response?.data?.error
    const backendMessage = err?.response?.data?.message || err?.response?.data?.mensaje
    const genericMessages = ['error al crear usuario', 'error creando usuario']

    if (backendError && String(backendError).trim()) return String(backendError).trim()

    if (backendMessage && String(backendMessage).trim()) {
      const normalizedMessage = String(backendMessage)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

      if (!genericMessages.includes(normalizedMessage)) {
        return String(backendMessage).trim()
      }
    }

    return err?.message || 'Error creando usuario'
  }

  const isDuplicateUserError = (err) => {
    const msg = getApiErrorMessage(err)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    return msg.includes('correo ya esta registrado')
      || msg.includes('el correo ya esta registrado')
      || msg.includes('run ya esta registrado')
      || msg.includes('el run ya esta registrado')
      || msg.includes('duplicate')
      || msg.includes('unique')
  }

  const shouldUseLocalFallback = (err) => {
    const status = err?.response?.status

    if (!status) return true
    if (status >= 500) return true
    if (status === 400 || status === 409) return false

    return false
  }

  const resetForm = () => {
    setNuevoUser({ run: '', firstName: '', lastName: '', email: '', password: '', role: '' })
    setEditingUser(null)
    setShowForm(false)
  }

  const clearFilters = () => {
    setSelectedRole('Todos')
    setSelectedStatus('Todos')
  }

  const handleStartCreate = () => {
    void openCreateUserModal()
  }

  const openCreateUserModal = async () => {
    const result = await Swal.fire({
      title: 'Crear usuario',
      html: `
        <div class="users-create-modal-form">
          <input id="swal-run" class="users-create-input" placeholder="RUN" maxlength="10" />
          <input id="swal-firstName" class="users-create-input" placeholder="Nombre" />
          <input id="swal-lastName" class="users-create-input" placeholder="Apellido" />
          <input id="swal-email" class="users-create-input" placeholder="Correo" type="email" />
          <input id="swal-password" class="users-create-input" placeholder="Password" type="password" />
          <select id="swal-role" class="users-create-input users-create-select">
            <option value="">Selecciona un rol</option>
            <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="TRABAJADOR">TRABAJADOR</option>
          </select>
        </div>
      `,
      width: 560,
      focusConfirm: false,
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Crear usuario',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'users-create-modal-popup',
        title: 'users-create-modal-title',
        htmlContainer: 'users-create-modal-content',
        confirmButton: 'users-create-modal-confirm',
        cancelButton: 'users-create-modal-cancel'
      },
      didOpen: () => {
        const runInput = document.getElementById('swal-run')
        if (runInput) {
          runInput.addEventListener('input', (event) => {
            event.target.value = formatRun(event.target.value)
          })
        }
      },
      preConfirm: () => {
        const run = formatRun(document.getElementById('swal-run')?.value?.trim() || '')
        const firstName = document.getElementById('swal-firstName')?.value?.trim() || ''
        const lastName = document.getElementById('swal-lastName')?.value?.trim() || ''
        const email = document.getElementById('swal-email')?.value?.trim() || ''
        const password = document.getElementById('swal-password')?.value || ''
        const role = document.getElementById('swal-role')?.value || ''

        if (!firstName || !lastName || !email || !password || !role) {
          Swal.showValidationMessage('Completa nombre, apellido, correo, password y rol')
          return false
        }

        return { run, firstName, lastName, email, password, role }
      }
    })

    if (!result.isConfirmed || !result.value) return

    try {
      try {
        await createUser(result.value)
      } catch (err) {
        const msg = getApiErrorMessage(err)

        if (isDuplicateUserError(err)) {
          showErrorToast(msg)
          return
        }

        if (!shouldUseLocalFallback(err)) {
          showErrorToast(msg)
          return
        }

        // Fallback local solo para errores tecnicos (sin respuesta/5xx).
        createUserAdmin(result.value)
        showErrorToast('Se uso copia local por falla del servidor')
      }

      showSuccessToast('Usuario creado')
      await refreshAll()
    } catch (err) {
      console.error('Error creating user', err)
      showErrorToast(getApiErrorMessage(err))
    }
  }

  const handleStartEditUser = (user) => {
    void openEditUserModal(user)
  }

  const openEditUserModal = async (user) => {
    const initialRun = formatRun(user.run || '')
    const initialFirstName = user.firstName || user.nombre || ''
    const initialLastName = user.lastName || user.apellidos || ''
    const initialEmail = user.email || ''
    const initialRole = typeof user.role === 'object' ? (user.role?.name || '') : (user.role || '')
    const userId = user.id || user._id || user.email

    const result = await Swal.fire({
      title: 'Editar usuario',
      html: `
        <div class="users-create-modal-form">
          <input id="swal-run" class="users-create-input" placeholder="RUN" maxlength="10" value="${initialRun}" />
          <input id="swal-firstName" class="users-create-input" placeholder="Nombre" value="${initialFirstName}" />
          <input id="swal-lastName" class="users-create-input" placeholder="Apellido" value="${initialLastName}" />
          <input id="swal-email" class="users-create-input" placeholder="Correo" type="email" value="${initialEmail}" />
          <input id="swal-password" class="users-create-input" placeholder="Password (opcional)" type="password" />
          <select id="swal-role" class="users-create-input users-create-select">
            <option value="">Selecciona un rol</option>
            <option value="ADMINISTRADOR" \${initialRole === 'ADMINISTRADOR' ? 'selected' : ''}>ADMINISTRADOR</option>
            <option value="SUPERVISOR" \${initialRole === 'SUPERVISOR' ? 'selected' : ''}>SUPERVISOR</option>
            <option value="TRABAJADOR" \${initialRole === 'TRABAJADOR' ? 'selected' : ''}>TRABAJADOR</option>
          </select>
        </div>
      `,
      width: 560,
      focusConfirm: false,
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Guardar cambios',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'users-create-modal-popup',
        title: 'users-create-modal-title',
        htmlContainer: 'users-create-modal-content',
        confirmButton: 'users-create-modal-confirm',
        cancelButton: 'users-create-modal-cancel'
      },
      didOpen: () => {
        const runInput = document.getElementById('swal-run')
        if (runInput) {
          runInput.addEventListener('input', (event) => {
            event.target.value = formatRun(event.target.value)
          })
        }
      },
      preConfirm: () => {
        const run = formatRun(document.getElementById('swal-run')?.value?.trim() || '')
        const firstName = document.getElementById('swal-firstName')?.value?.trim() || ''
        const lastName = document.getElementById('swal-lastName')?.value?.trim() || ''
        const email = document.getElementById('swal-email')?.value?.trim() || ''
        const password = document.getElementById('swal-password')?.value || ''
        const role = document.getElementById('swal-role')?.value || ''

        if (!firstName || !lastName || !email || !role) {
          Swal.showValidationMessage('Completa nombre, apellido, correo y rol')
          return false
        }

        return { run, firstName, lastName, email, password, role }
      }
    })

    if (!result.isConfirmed || !result.value) return

    const payload = { ...result.value }
    if (!payload.password) delete payload.password

    try {
      try {
        await updateUser(userId, payload)
      } catch (err) {
        updateUserAdmin(userId, payload)
      }

      showSuccessToast('Usuario actualizado')
      await refreshAll()
    } catch (err) {
      console.error('Error updating user', err)
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error actualizando usuario'
      showErrorToast(msg)
    }
  }

  const handleToggleUserStatus = (user, forceActivo = null) => {
    const id = user.id || user._id || user.email
    const name = `${user.firstName || user.nombre || ''} ${user.lastName || user.apellidos || ''}`.trim() || user.email || 'este usuario'
    const isCurrentlyActive = resolveUserStatus(user) === 'Activo'
    const nextActivo = typeof forceActivo === 'boolean' ? forceActivo : !isCurrentlyActive
    const actionLabel = nextActivo ? 'activar' : 'desactivar'
    const actionLabelCap = nextActivo ? 'Activar' : 'Desactivar'

    confirmAction({
      title: `${actionLabelCap} usuario`,
      text: `¿${actionLabelCap} a ${name}?`,
      confirmText: actionLabelCap
    }).then(async (ok) => {
      if (!ok) return

      try {
        try {
          // Endpoint oficial del backend para cambiar estado del usuario.
          await updateUserEstado(id, nextActivo)
        } catch (err) {
          // Si el backend falla (403, 500, etc), mostrar el error específico y luego el fallback local.
          console.error(`Backend error ${actionLabel} user:`, err?.response?.status, err?.response?.data)

          // Si es 403, significa que no tiene permisos en el backend: mostrar el error específico.
          if (err?.response?.status === 403) {
            showErrorToast(`Permiso denegado (403): ${err?.response?.data?.mensaje || err?.response?.data?.error || `No tienes permisos para ${actionLabel} usuarios`}`)
            return
          }

          // Para otros errores, usar fallback local.
          updateUserAdmin(id, {
            activo: nextActivo,
            status: nextActivo ? 'Activo' : 'Inactivo',
            estado: nextActivo ? 'Activo' : 'Inactivo'
          })
          showErrorToast('Se usó copia local por falla del servidor')
        }

        showSuccessToast(`Usuario ${nextActivo ? 'activado' : 'desactivado'}`)
        await refreshAll()
      } catch (err) {
        console.error(`Error ${actionLabel} user`, err)
        showErrorToast(`Error al ${actionLabel} usuario`)
      }
    })
  }

  // Unifica el estado sin importar si viene como activo (boolean), status o estado.
  function resolveUserStatus(user) {
    if (typeof user?.activo === 'boolean') {
      return user.activo ? 'Activo' : 'Inactivo'
    }

    const backendStatus = user?.status || user?.estado
    if (!backendStatus) return 'Activo'

    const normalized = String(backendStatus).toLowerCase()
    return normalized === 'activo' ? 'Activo' : 'Inactivo'
  }

  // Define el color de la etiqueta segun el estado.
  const getBadgeColor = (status) => {
    return status === 'Activo' ? 'success' : 'danger'
  }

  return (
    <div className="users-view container-fluid px-0">
      <CCard className="users-card mb-4 shadow-sm border-0">
        {/* Encabezado principal. */}
        <CCardHeader className="bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <h4 className="mb-0 fw-bold">Gestión de Usuarios</h4>
          {canManageUsers() && (
            <CButton color="dark" className="d-flex align-items-center gap-2" onClick={handleStartCreate}>
              <CIcon icon={cilPlus} /> Añadir usuario
            </CButton>
          )}
        </CCardHeader>

        <CCardBody>
          {/* Barra de herramientas: buscador y filtros. */}
          <div className="users-toolbar d-flex justify-content-between mb-3">
            <CInputGroup className="users-search">
              <CInputGroupText className="bg-white">
                <CIcon icon={cilSearch} />
              </CInputGroupText>
              <CFormInput
                placeholder="Buscar por nombre o correo..."
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
                <CIcon icon={cilFilter} /> Filtros
              </CButton>
            </div>
          </div>

          {showFilters && (
            <div className="d-flex flex-wrap gap-2 mb-3">
              <div>
                <label htmlFor="role-filter" className="form-label mb-1">Rol</label>
                <select
                  id="role-filter"
                  className="form-select"
                  style={{ maxWidth: '220px' }}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  aria-label="Filtrar por rol"
                >
                  <option value="Todos">Todos</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Trabajador">Trabajador</option>
                </select>
              </div>
              <div>
                <label htmlFor="status-filter" className="form-label mb-1">Estado</label>
                <select
                  id="status-filter"
                  className="form-select"
                  style={{ maxWidth: '220px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  aria-label="Filtrar por estado"
                >
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="d-flex align-items-end">
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </CButton>
              </div>
            </div>
          )}

          {/* Tabla de datos. */}
          <div className="users-table-wrapper">
          <CTable align="middle" responsive hover className="users-table border text-center mb-0">
            <CTableHead color="primary">
              <CTableRow>
                <CTableHeaderCell className="text-start d-none d-sm-table-cell" style={{ width: '40px' }}>
                  <CFormCheck />
                </CTableHeaderCell>
                <CTableHeaderCell className="text-start">Usuario</CTableHeaderCell>
                <CTableHeaderCell>Rol</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-md-table-cell">Estado</CTableHeaderCell>
                {canManageUsers() && <CTableHeaderCell className="d-none d-sm-table-cell">Acciones</CTableHeaderCell>}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {paginatedUsers
                .map((user) => (
                  <CTableRow key={user.id || user._id || user.email}>
                    <CTableDataCell className="text-start d-none d-sm-table-cell">
                      <CFormCheck id={`check-${user.id || user._id || user.email}`} />
                    </CTableDataCell>

                    {/* Columna de nombre, avatar y email. */}
                    <CTableDataCell className="text-start">
                      <div className="d-flex align-items-center gap-3">
                        <CAvatar src={user.avatar} size="md" />
                        <div>
                          <div className="fw-semibold">{`${user.firstName || user.nombre || ''} ${user.lastName || user.apellidos || ''}`.trim() || 'Sin nombre'}</div>
                          <div className="small text-secondary">{user.email}</div>
                        </div>
                      </div>
                    </CTableDataCell>

                    {/* Columna de rol. */}
                    <CTableDataCell>
                      <span className="fw-medium">{typeof user.role === 'object' ? (user.role?.name || '-') : (user.role || '-')}</span>
                    </CTableDataCell>

                    {/* Columna de estado (badge). */}
                    <CTableDataCell className="d-none d-md-table-cell">
                      <CBadge color={getBadgeColor(resolveUserStatus(user))} shape="rounded-pill" className="px-3 py-2">
                        {resolveUserStatus(user)}
                      </CBadge>
                    </CTableDataCell>

                    {/* Columna de acciones. */}
                    {canManageUsers() && (
                    <CTableDataCell className="d-none d-sm-table-cell">
                      <div className="users-actions d-flex justify-content-center gap-2">
                        <CButton
                          color="info"
                          variant="outline"
                          className="users-action-btn"
                          title="Editar perfil"
                          aria-label={`Editar perfil de ${user.email || 'usuario'}`}
                          onClick={() => handleStartEditUser(user)}
                        >
                          <CIcon icon={cilPencil} size="sm" />
                        </CButton>
                        <CButton
                          color="warning"
                          variant="outline"
                          className="users-action-btn"
                          title="Editar usuario"
                          aria-label={`Editar usuario ${user.email || 'usuario'}`}
                          onClick={() => handleStartEditUser(user)}
                        >
                          <CIcon icon={cilSwapHorizontal} size="sm" />
                        </CButton>
                        <CButton
                          color="danger"
                          className="users-action-btn users-action-btn-danger"
                          title="Desactivar usuario"
                          aria-label={`Desactivar usuario ${user.email || 'usuario'}`}
                          onClick={() => handleToggleUserStatus(user, false)}
                          style={{ display: resolveUserStatus(user) === 'Activo' ? 'inline-flex' : 'none' }}
                        >
                          <CIcon icon={cilBan} size="sm" />
                        </CButton>
                        <CButton
                          color="success"
                          className="users-action-btn users-action-btn-success"
                          title="Activar usuario"
                          aria-label={`Activar usuario ${user.email || 'usuario'}`}
                          onClick={() => handleToggleUserStatus(user, true)}
                          style={{ display: resolveUserStatus(user) === 'Inactivo' ? 'inline-flex' : 'none' }}
                        >
                          <CIcon icon={cilCheckCircle} size="sm" />
                        </CButton>
                      </div>
                    </CTableDataCell>
                    )}
                  </CTableRow>
                ))}
            </CTableBody>
          </CTable>
          </div>

          {/* Paginacion inferior. */}
          <div className="users-footer d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <div className="small text-secondary">
              {loading
                ? 'Cargando usuarios...'
                : `Mostrando ${paginatedUsers.length} de ${filteredUsers.length} usuarios (pagina ${currentPage}/${totalPages})`}
            </div>
            <CPagination aria-label="Page navigation" className="mb-0" style={{ cursor: 'pointer' }}>
              <CPaginationItem disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>Anterior</CPaginationItem>
              {pageNumbers.map((page) => (
                <CPaginationItem
                  key={`users-page-${page}`}
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
    </div>
  )
}
