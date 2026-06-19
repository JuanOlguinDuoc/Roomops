import Swal from 'sweetalert2'
import {
  getCurrentTaskTimestamps,
  normalizeTimeValue,
  getPriorityByType,
  isTrabajadorUser,
  getTaskType,
  getTaskDate,
  getTaskDueTime,
  getTaskApartmentId,
  getTaskAssignedUserId,
  getTaskStatusId
} from './TaskFunctions'

export const openCreateTaskModal = async (apartments = [], users = [], statuses = []) => {
  const apartmentSelectOptions = apartments
    .filter((apartment) => apartment?.id != null)
    .map((apartment) => `<option value="${apartment.id}">${apartment.nombre || `Apartamento ${apartment.id}`}</option>`)
    .join('')

  const userSelectOptions = users
    .filter((user) => user?.id != null && isTrabajadorUser(user))
    .map((user) => {
      const label = `${user.firstName || user.nombre || ''} ${user.lastName || user.apellidos || ''}`.trim() || user.email || `Usuario ${user.id}`
      return `<option value="${user.id}">${label}</option>`
    })
    .join('')

  const statusSelectOptions = statuses
    .filter((status) => status?.id != null)
    .map((status) => `<option value="${status.id}">${status.nombre || `Estado ${status.id}`}</option>`)
    .join('')

  const result = await Swal.fire({
    title: 'Crear tarea',
    html: `
      <div class="users-create-modal-form">
        <input id="swal-titulo" class="users-create-input" placeholder="Titulo" maxlength="100" />
        <textarea id="swal-descripcion" class="users-create-input users-create-textarea" placeholder="Descripcion" rows="3"></textarea>
        <select id="swal-tipo" class="users-create-input users-create-select">
          <option value="">Selecciona tipo</option>
          <option value="Aseo">Aseo</option>
          <option value="Repaso">Repaso</option>
          <option value="Mantencion">Mantencion</option>
        </select>
        <select id="swal-apartmentId" class="users-create-input users-create-select">
          <option value="">Selecciona apartamento</option>
          ${apartmentSelectOptions}
        </select>
        <select id="swal-assignedUserId" class="users-create-input users-create-select">
          <option value="">Sin asignar</option>
          ${userSelectOptions}
        </select>
        <select id="swal-statusId" class="users-create-input users-create-select">
          <option value="">Selecciona estado</option>
          ${statusSelectOptions}
        </select>
      </div>
    `,
    width: 560,
    focusConfirm: false,
    showCancelButton: true,
    buttonsStyling: false,
    confirmButtonText: 'Crear tarea',
    cancelButtonText: 'Cancelar',
    customClass: {
      popup: 'users-create-modal-popup',
      title: 'users-create-modal-title',
      htmlContainer: 'users-create-modal-content',
      confirmButton: 'users-create-modal-confirm',
      cancelButton: 'users-create-modal-cancel'
    },
    preConfirm: () => {
      const autoTimestamps = getCurrentTaskTimestamps()
      const titulo = document.getElementById('swal-titulo')?.value?.trim() || ''
      const descripcion = document.getElementById('swal-descripcion')?.value?.trim() || ''
      const tipo = document.getElementById('swal-tipo')?.value?.trim() || ''
      const prioridad = getPriorityByType(tipo)
      const apartmentIdRaw = document.getElementById('swal-apartmentId')?.value || ''
      const assignedUserIdRaw = document.getElementById('swal-assignedUserId')?.value || ''
      const statusIdRaw = document.getElementById('swal-statusId')?.value || ''

      if (!titulo) { Swal.showValidationMessage('El titulo es obligatorio'); return false }
      if (!apartmentIdRaw) { Swal.showValidationMessage('Debes seleccionar un apartamento'); return false }
      if (!statusIdRaw) { Swal.showValidationMessage('Debes seleccionar un estado'); return false }
      if (!tipo) { Swal.showValidationMessage('Debes seleccionar el tipo de tarea'); return false }
      if (!prioridad) { Swal.showValidationMessage('No se pudo determinar la prioridad automaticamente'); return false }

      return {
        titulo,
        descripcion,
        tipo,
        prioridad,
        fecha: autoTimestamps.fecha,
        dueTime: autoTimestamps.dueTime,
        apartmentId: Number(apartmentIdRaw),
        assignedUserId: assignedUserIdRaw ? Number(assignedUserIdRaw) : null,
        statusId: Number(statusIdRaw),
        checklist: []
      }
    }
  })

  return result
}

export const openEditTaskModal = async (task = {}, apartments = [], users = [], statuses = []) => {
  const initialTitle = task.titulo || ''
  const initialDescription = task.descripcion || ''
  const initialType = getTaskType(task)
  const initialDate = getTaskDate(task)
  const initialDueTime = getTaskDueTime(task)
  const initialApartmentId = getTaskApartmentId(task)
  const initialAssignedUserId = getTaskAssignedUserId(task)
  const initialStatusId = getTaskStatusId(task)
  const initialDueTimeInputValue = normalizeTimeValue(initialDueTime)

  const apartmentSelectOptions = apartments
    .filter((apartment) => apartment?.id != null)
    .map((apartment) => `<option value="${apartment.id}" ${Number(apartment.id) === Number(initialApartmentId) ? 'selected' : ''}>${apartment.nombre || `Apartamento ${apartment.id}`}</option>`)
    .join('')

  const userSelectOptions = users
    .filter((user) => user?.id != null && isTrabajadorUser(user))
    .map((user) => {
      const label = `${user.firstName || user.nombre || ''} ${user.lastName || user.apellidos || ''}`.trim() || user.email || `Usuario ${user.id}`
      return `<option value="${user.id}" ${Number(user.id) === Number(initialAssignedUserId) ? 'selected' : ''}>${label}</option>`
    })
    .join('')

  const statusSelectOptions = statuses
    .filter((status) => status?.id != null)
    .map((status) => `<option value="${status.id}" ${Number(status.id) === Number(initialStatusId) ? 'selected' : ''}>${status.nombre || `Estado ${status.id}`}</option>`)
    .join('')

  const result = await Swal.fire({
    title: 'Editar tarea',
    html: `
      <div class="users-create-modal-form">
        <input id="swal-titulo" class="users-create-input" placeholder="Titulo" maxlength="100" value="${initialTitle}" />
        <textarea id="swal-descripcion" class="users-create-input users-create-textarea" placeholder="Descripcion" rows="3">${initialDescription}</textarea>
        <select id="swal-tipo" class="users-create-input users-create-select">
          <option value="" ${!initialType ? 'selected' : ''}>Selecciona tipo</option>
          <option value="Aseo" ${initialType === 'Aseo' ? 'selected' : ''}>Aseo</option>
          <option value="Repaso" ${initialType === 'Repaso' ? 'selected' : ''}>Repaso</option>
          <option value="Mantencion" ${initialType === 'Mantencion' ? 'selected' : ''}>Mantencion</option>
        </select>
        <select id="swal-apartmentId" class="users-create-input users-create-select">
          <option value="">Selecciona apartamento</option>
          ${apartmentSelectOptions}
        </select>
        <select id="swal-assignedUserId" class="users-create-input users-create-select">
          <option value="">Sin asignar</option>
          ${userSelectOptions}
        </select>
        <select id="swal-statusId" class="users-create-input users-create-select">
          <option value="">Selecciona estado</option>
          ${statusSelectOptions}
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
      const titulo = document.getElementById('swal-titulo')?.value?.trim() || ''
      const descripcion = document.getElementById('swal-descripcion')?.value?.trim() || ''
      const tipo = document.getElementById('swal-tipo')?.value?.trim() || ''
      const prioridad = getPriorityByType(tipo)
      // Fecha y hora no son editables desde este modal: conservar valores actuales de la tarea
      const fecha = initialDate || null
      const dueTimeRaw = initialDueTimeInputValue || null
      const apartmentIdRaw = document.getElementById('swal-apartmentId')?.value || ''
      const assignedUserIdRaw = document.getElementById('swal-assignedUserId')?.value || ''
      const statusIdRaw = document.getElementById('swal-statusId')?.value || ''

      if (!titulo) { Swal.showValidationMessage('El titulo es obligatorio'); return false }
      if (!apartmentIdRaw) { Swal.showValidationMessage('Debes seleccionar un apartamento'); return false }
      if (!statusIdRaw) { Swal.showValidationMessage('Debes seleccionar un estado'); return false }
      if (!tipo) { Swal.showValidationMessage('Debes seleccionar el tipo de tarea'); return false }
      if (!prioridad) { Swal.showValidationMessage('No se pudo determinar la prioridad automaticamente'); return false }

      return {
        titulo,
        descripcion,
        tipo,
        prioridad,
        fecha: fecha || null,
        dueTime: dueTimeRaw || null,
        apartmentId: Number(apartmentIdRaw),
        assignedUserId: assignedUserIdRaw ? Number(assignedUserIdRaw) : null,
        statusId: Number(statusIdRaw),
        checklist: task.checklist || task.listaVerificacion || []
      }
    }
  })

  return result
}
