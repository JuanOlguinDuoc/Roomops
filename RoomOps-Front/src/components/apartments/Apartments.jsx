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
import { CircleCheckBig, CircleX,Layers } from 'lucide-react';
import CIcon from '@coreui/icons-react'
import { cilSearch, cilFilter, cilPlus, cilPencil, cilSwapHorizontal, cilCheckCircle, cilBan } from '@coreui/icons'
import Swal from 'sweetalert2'
import './Apartments.css'
import '../users/users.css'
import { Navigate } from 'react-router-dom'
import { confirmAction } from '../../utils/alert'
import { showErrorToast, showSuccessToast } from '../../utils/toast'
import {
  isUserLoggedIn, isUserAdmin, isUserSupervisor,
  getAllApartments, createApartmentLocal, updateApartmentLocal, updateApartmentEstadoLocal
} from '../../service/localStorage'
import {
  canViewApartments,
  canManageApartments
} from '../../service/permissions'
import {
  getApartments,
  createApartment,
  updateApartment,
  updateApartmentEstado
}
  from '../../service/apartmentService'

export default function Apartments() {
  // Control de acceso: solo usuarios que puedan ver apartamentos
  const isLoggedIn = isUserLoggedIn()
  const canAccess = canViewApartments()
  const canManage = canManageApartments()

  if (!isLoggedIn) {
    return <Navigate to="/login?redirect=/apartments" replace />
  }

  // Si está logueado pero no tiene permisos, redirigir sin toast durante render
  if (!canAccess) {
    return <Navigate to="/" replace />
  }

  // Estado principal de la pantalla.
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState('Todos')
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

  // Cargar apartamentos al montar la vista.
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
    // Normaliza texto para buscar sin diferenciar mayusculas ni acentos.
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  const getApartmentSearchIndex = (apartment = {}) => {
    // Campos indexados para busqueda libre.
    const nombre = apartment.nombre || apartment.name || ''
    const piso = apartment.piso ?? apartment.floor ?? ''
    return normalizeSearchText(`${nombre} ${piso}`)
  }

  const resolveApartmentStatus = (apartment = {}) => {
    // Unifica estado para datos backend o fallback local.
    if (typeof apartment?.activo === 'boolean') {
      return apartment.activo ? 'Activo' : 'Inactivo'
    }

    const backendStatus = apartment?.status || apartment?.estado
    if (!backendStatus) return 'Activo'

    const normalized = String(backendStatus).toLowerCase()
    return normalized === 'activo' ? 'Activo' : 'Inactivo'
  }

  const getBadgeColor = (status) => {
    // Color de badge segun estado visual.
    return status === 'Activo' ? 'success' : 'danger'
  }

  const floorOptions = useMemo(() => {
    // Lista de pisos dinamica para el filtro.
    const values = apartments
      .map((apartment) => apartment?.piso)
      .filter((piso) => Number.isInteger(Number(piso)))
      .map((piso) => String(piso))

    return ['Todos', ...Array.from(new Set(values)).sort((a, b) => Number(a) - Number(b))]
  }, [apartments])

  const refreshAll = async () => {
    setLoading(true)
    // Estrategia híbrida: primero intentamos backend, si falla usamos localStorage.
    try {
      const apartmentsFromApi = await getApartments()
      setApartments(Array.isArray(apartmentsFromApi) ? apartmentsFromApi : [])
    } catch (err) {
      console.error('Error fetching apartments from API, falling back to localStorage', err)
      // Fallback local para no romper la vista cuando el backend no responde.
      setApartments(getAllApartments())
    } finally {
      setLoading(false)
    }
  }

  const filteredApartment = useMemo(() => {
    // Filtro combinado: texto + piso + estado.
    const term = normalizeSearchText(searchTerm)

    return apartments.filter((apartment) => {
      const matchesSearch = !term || getApartmentSearchIndex(apartment).includes(term)
      const matchesFloor = selectedFloor === 'Todos' || String(apartment?.piso ?? '') === selectedFloor
      const matchesStatus = selectedStatus === 'Todos' || resolveApartmentStatus(apartment) === selectedStatus
      return matchesSearch && matchesFloor && matchesStatus
    })
  }, [apartments, searchTerm, selectedFloor, selectedStatus])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredApartment.length / rowsPerPage))
  }, [filteredApartment.length, rowsPerPage])

  const paginatedApartments = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredApartment.slice(start, start + rowsPerPage)
  }, [filteredApartment, currentPage, rowsPerPage])

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
  }, [searchTerm, selectedFloor, selectedStatus, rowsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const clearFilters = () => {
    // Limpia solo filtros, manteniendo busqueda por texto si el usuario la puso.
    setSelectedFloor('Todos')
    setSelectedStatus('Todos')
  }

  const parseApartmentFromResponse = (resp) => {
    // Soporta respuestas en formatos distintos (dto directo o wrapper con apartment).
    if (!resp) return null
    return resp.apartment || resp.data?.apartment || resp
  }

  const openCreateApartmentModal = async () => {
    // Modal para crear apartamento con validacion basica en cliente.
    const result = await Swal.fire({
      title: 'Crear apartamento',
      html: `
        <div class="users-create-modal-form">
          <input id="swal-nombre" class="users-create-input" placeholder="Nombre (ej: A101)" maxlength="10" />
          <input id="swal-piso" class="users-create-input" placeholder="Piso" type="number" />
          <select id="swal-activo" class="users-create-input users-create-select">
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      `,
      width: 560,
      focusConfirm: false,
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Crear apartamento',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'users-create-modal-popup',
        title: 'users-create-modal-title',
        htmlContainer: 'users-create-modal-content',
        confirmButton: 'users-create-modal-confirm',
        cancelButton: 'users-create-modal-cancel'
      },
      preConfirm: () => {
        const nombre = document.getElementById('swal-nombre')?.value?.trim() || ''
        const pisoRaw = document.getElementById('swal-piso')?.value
        const activoRaw = document.getElementById('swal-activo')?.value
        const piso = Number(pisoRaw)
        const activo = activoRaw === 'true'

        if (!nombre) {
          Swal.showValidationMessage('El nombre es obligatorio')
          return false
        }
        if (!Number.isInteger(piso)) {
          Swal.showValidationMessage('El piso debe ser un numero entero')
          return false
        }

        return { nombre, piso, activo }
      }
    })

    if (!result.isConfirmed || !result.value) return

    try {
      try {
        // Camino principal: backend.
        const response = await createApartment(result.value)
        const created = parseApartmentFromResponse(response)
        if (!created) {
          throw new Error('Respuesta inesperada del backend')
        }
      } catch (err) {
        // Camino alternativo: localStorage.
        const localResult = createApartmentLocal(result.value)
        if (!localResult?.success) {
          throw new Error(localResult?.error || localResult?.message || 'No se pudo crear en localStorage')
        }
      }

      showSuccessToast('Apartamento creado')
      await refreshAll()
    } catch (err) {
      console.error('Error creating apartment', err)
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error creando apartamento'
      showErrorToast(msg)
    }
  }

  const handleStartCreate = () => {
    void openCreateApartmentModal()
  }

  const openEditApartmentModal = async (apartment) => {
    // Modal para edicion completa (nombre, piso, activo).
    const apartmentId = apartment.id
    const initialName = apartment.nombre || ''
    const initialFloor = apartment.piso ?? ''
    const initialStatus = resolveApartmentStatus(apartment) === 'Activo'

    const result = await Swal.fire({
      title: 'Editar apartamento',
      html: `
        <div class="users-create-modal-form">
          <input id="swal-nombre" class="users-create-input" placeholder="Nombre" maxlength="10" value="${initialName}" />
          <input id="swal-piso" class="users-create-input" placeholder="Piso" type="number" value="${initialFloor}" />
          <select id="swal-activo" class="users-create-input users-create-select">
            <option value="true" ${initialStatus ? 'selected' : ''}>Activo</option>
            <option value="false" ${!initialStatus ? 'selected' : ''}>Inactivo</option>
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
      preConfirm: () => {
        const nombre = document.getElementById('swal-nombre')?.value?.trim() || ''
        const pisoRaw = document.getElementById('swal-piso')?.value
        const activoRaw = document.getElementById('swal-activo')?.value
        const piso = Number(pisoRaw)
        const activo = activoRaw === 'true'

        if (!nombre) {
          Swal.showValidationMessage('El nombre es obligatorio')
          return false
        }
        if (!Number.isInteger(piso)) {
          Swal.showValidationMessage('El piso debe ser un numero entero')
          return false
        }

        return { nombre, piso, activo }
      }
    })

    if (!result.isConfirmed || !result.value) return

    try {
      try {
        // Camino principal: backend.
        await updateApartment(apartmentId, result.value)
      } catch (err) {
        // Camino alternativo: localStorage.
        const localResult = updateApartmentLocal(apartmentId, result.value)
        if (!localResult?.success) {
          throw new Error(localResult?.error || localResult?.message || 'No se pudo actualizar en localStorage')
        }
      }

      showSuccessToast('Apartamento actualizado')
      await refreshAll()
    } catch (err) {
      console.error('Error updating apartment', err)
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error actualizando apartamento'
      showErrorToast(msg)
    }
  }

  const handleToggleApartmentStatus = (apartment, forceActivo = null) => {
    // Cambio de estado con confirmacion previa.
    const id = apartment.id
    const name = apartment.nombre || 'este apartamento'
    const isCurrentlyActive = resolveApartmentStatus(apartment) === 'Activo'
    const nextActivo = typeof forceActivo === 'boolean' ? forceActivo : !isCurrentlyActive
    const actionLabel = nextActivo ? 'activar' : 'desactivar'
    const actionLabelCap = nextActivo ? 'Activar' : 'Desactivar'

    confirmAction({
      title: `${actionLabelCap} apartamento`,
      text: `¿${actionLabelCap} ${name}?`,
      confirmText: actionLabelCap
    }).then(async (ok) => {
      if (!ok) return

      try {
        try {
          // Camino principal: endpoint patch de estado en backend.
          await updateApartmentEstado(id, nextActivo)
        } catch (err) {
          console.error(`Backend error ${actionLabel} apartment:`, err?.response?.status, err?.response?.data)

          if (err?.response?.status === 403) {
            showErrorToast(`Permiso denegado (403): ${err?.response?.data?.mensaje || err?.response?.data?.error || `No tienes permisos para ${actionLabel} apartamentos`}`)
            return
          }

          // Fallback local si el backend no esta disponible.
          const localResult = updateApartmentEstadoLocal(id, nextActivo)
          if (!localResult?.success) {
            throw new Error(localResult?.error || localResult?.message || 'No se pudo cambiar estado en localStorage')
          }
          showErrorToast('Se uso copia local por falla del servidor')
        }

        showSuccessToast(`Apartamento ${nextActivo ? 'activado' : 'desactivado'}`)
        await refreshAll()
      } catch (err) {
        console.error(`Error ${actionLabel} apartment`, err)
        showErrorToast(`Error al ${actionLabel} apartamento`)
      }
    })
  }

  return (
    <div className="users-view container-fluid px-0">
      <CCard className="users-card mb-4 shadow-sm border-0">
        {/* Encabezado principal. */}
        <CCardHeader className="bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <h4 className="mb-0 fw-bold">Gestión de Apartamentos</h4>
          {canManage && (
            <CButton color="dark" className="d-flex align-items-center gap-2" onClick={handleStartCreate}>
              <CIcon icon={cilPlus} /> Añadir Apartamento
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
                placeholder="Buscar por numero o piso..."
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
                <CIcon icon={cilFilter} /> Filtrar
              </CButton>
            </div>
          </div>

          {showFilters && (
            <div className="d-flex flex-wrap gap-2 mb-3">
              <div>
                <label htmlFor="floor-filter" className="form-label mb-1">Piso</label>
                <select
                  id="floor-filter"
                  className="form-select"
                  style={{ maxWidth: '220px' }}
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  aria-label="Filtrar por piso"
                >
                  {floorOptions.map((floorValue) => (
                    <option key={floorValue} value={floorValue}>{floorValue}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status-filter" className="form-label mb-1">Disponibilidad</label>
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

          {/* Tabla principal con la misma estructura usada en la vista de usuarios. */}
          {/* Tabla de datos. */}
          <div className="users-table-wrapper">
            <CTable align="middle" responsive hover className="users-table border text-center mb-0">
              <CTableHead color="primary">
                <CTableRow>
                  <CTableHeaderCell className="text-start d-none d-sm-table-cell" style={{ width: '40px' }}>
                    <CFormCheck />
                  </CTableHeaderCell>
                    <CTableHeaderCell className="text-start">Apartamento</CTableHeaderCell>
                    <CTableHeaderCell>Piso</CTableHeaderCell>
                  <CTableHeaderCell className="d-none d-md-table-cell">Disponibilidad</CTableHeaderCell>
                  {canManage && <CTableHeaderCell className="d-none d-sm-table-cell">Acciones</CTableHeaderCell>}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {paginatedApartments
                    .map((apartment) => (
                      <CTableRow key={apartment.id}>
                      <CTableDataCell className="text-start d-none d-sm-table-cell">
                          <CFormCheck id={`check-${apartment.id}`} />
                      </CTableDataCell>

                        {/* Columna de nombre y detalle de piso. */}
                      <CTableDataCell className="text-start">
                        <div className="d-flex align-items-center gap-3">
                            <CAvatar color="secondary" textColor="white" size="md">A</CAvatar>
                          <div>
                              <div className="fw-semibold">{apartment.nombre || 'Sin nombre'}</div>
                              <div className="small text-secondary">ID: {apartment.id ?? '-'}</div>
                          </div>
                        </div>
                      </CTableDataCell>

                        {/* Columna de piso. */}
                      <CTableDataCell>
                          <span className="fw-medium"> <Layers/> {apartment.piso ?? '-'}</span>
                      </CTableDataCell>

                      {/* Columna de estado (badge). */}
                      <CTableDataCell className="d-none d-md-table-cell">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <CBadge
                              color={getBadgeColor(resolveApartmentStatus(apartment))}
                              shape="rounded-pill"
                              className="px-3 py-2 d-inline-flex align-items-center gap-1"
                            >
                              {resolveApartmentStatus(apartment) === 'Activo'
                                ? <CircleCheckBig size={20} />
                                : <CircleX size={20} />
                              }
                              {resolveApartmentStatus(apartment)}
                            </CBadge>
                          </div>
                      </CTableDataCell>

                      {/* Columna de acciones. */}
                      {canManage && (
                        <CTableDataCell className="d-none d-sm-table-cell">
                          <div className="users-actions d-flex justify-content-center gap-2">
                            <CButton
                              color="info"
                              variant="outline"
                              className="users-action-btn"
                              title="Editar apartamento"
                              aria-label={`Editar apartamento ${apartment.nombre || 'apartamento'}`}
                              onClick={() => void openEditApartmentModal(apartment)}
                            >
                              <CIcon icon={cilPencil} size="sm" />
                            </CButton>
                            <CButton
                              color="warning"
                              variant="outline"
                              className="users-action-btn"
                              title="Editar apartamento"
                              aria-label={`Editar apartamento ${apartment.nombre || 'apartamento'}`}
                              onClick={() => void openEditApartmentModal(apartment)}
                            >
                              <CIcon icon={cilSwapHorizontal} size="sm" />
                            </CButton>
                            <CButton
                              color="danger"
                              className="users-action-btn users-action-btn-danger"
                              title="Desactivar apartamento"
                              aria-label={`Desactivar apartamento ${apartment.nombre || 'apartamento'}`}
                              onClick={() => handleToggleApartmentStatus(apartment, false)}
                              style={{ display: resolveApartmentStatus(apartment) === 'Activo' ? 'inline-flex' : 'none' }}
                            >
                              <CIcon icon={cilBan} size="sm" />
                            </CButton>
                            <CButton
                              color="success"
                              className="users-action-btn users-action-btn-success"
                              title="Activar apartamento"
                              aria-label={`Activar apartamento ${apartment.nombre || 'apartamento'}`}
                              onClick={() => handleToggleApartmentStatus(apartment, true)}
                              style={{ display: resolveApartmentStatus(apartment) === 'Inactivo' ? 'inline-flex' : 'none' }}
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
                ? 'Cargando apartamentos...'
                : `Mostrando ${paginatedApartments.length} de ${filteredApartment.length} apartamentos (pagina ${currentPage}/${totalPages})`}
            </div>
            <CPagination aria-label="Page navigation" className="mb-0" style={{ cursor: 'pointer' }}>
              <CPaginationItem disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>Anterior</CPaginationItem>
              {pageNumbers.map((page) => (
                <CPaginationItem
                  key={`apartments-page-${page}`}
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
