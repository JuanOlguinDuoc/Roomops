import React, { useEffect, useMemo, useState } from 'react'
import { Building2, UserRound, CalendarDays, ClipboardClock, CheckSquare, Plus, X } from 'lucide-react'
import Swal from 'sweetalert2'
import {
  getTaskApartmentId,
  getTaskAssignedUserId,
  getTaskDate,
  getTaskDueTime,
  getTaskType
} from '../task/TaskFunctions'
import './taskDetail.css'

const normalizeText = (value = '') => {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const getChecklistItemState = (item = {}) => {
  const rawState = item?.estado || item?.status || item?.checklistStatus || item?.estadoChecklist || ''
  const normalized = normalizeText(rawState)

  if (normalized.includes('bloquead') || normalized.includes('blocked')) {
    return { key: 'blocked', label: 'BLOQUEADO' }
  }

  if (normalized.includes('complet') || normalized.includes('hecho') || normalized.includes('done')) {
    return { key: 'done', label: 'HECHO' }
  }

  return { key: 'pending', label: 'PENDIENTE' }
}

const getChecklistItemTitle = (item = {}, index = 0) => {
  return item?.titulo || item?.title || item?.nombre || item?.descripcion || `Item ${index + 1}`
}

const getChecklistItemNote = (item = {}) => {
  return item?.nota || item?.observacion || item?.comentario || item?.detalle || ''
}

const getChecklistItemDescription = (item = {}) => {
  return item?.descripcion || item?.titulo || item?.title || item?.nombre || ''
}

const applyChecklistStateToItem = (item = {}, stateKey = 'pending') => {
  if (stateKey === 'done') {
    return {
      ...item,
      estado: 'HECHO'
    }
  }

  if (stateKey === 'blocked') {
    return {
      ...item,
      estado: 'BLOQUEADO'
    }
  }

  return {
    ...item,
    estado: 'PENDIENTE'
  }
}

const normalizeChecklistItemForSave = (item = {}) => {
  const state = getChecklistItemState(item)
  const description = getChecklistItemDescription(item).trim()
  const note = getChecklistItemNote(item).trim()

  return {
    descripcion: description,
    estado: state.key === 'done' ? 'HECHO' : state.key === 'blocked' ? 'BLOQUEADO' : 'PENDIENTE',
    nota: state.key === 'blocked' ? note : ''
  }
}

export default function TaskDetailPanel({
  isOpen,
  task,
  onClose,
  apartmentNameById,
  userNameById,
  statusNameById,
  getDeadLine,
  onSaveChecklist
}) {
  const [editableChecklist, setEditableChecklist] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const rawChecklist = task?.checklist || task?.listaVerificacion || []
    setEditableChecklist(Array.isArray(rawChecklist) ? rawChecklist : [])
  }, [task, isOpen])

  const checklistDoneCount = useMemo(() => {
    return editableChecklist.filter((item) => getChecklistItemState(item).key === 'done').length
  }, [editableChecklist])

  const handleAddChecklistPending = async () => {
    const result = await Swal.fire({
      title: 'Nuevo pendiente del checklist',
      html: `
        <div class="users-create-modal-form">
          <input
            id="swal-checklist-pending"
            class="users-create-input"
            placeholder="Ej: Reponer toallas"
            maxlength="120"
          />
        </div>
      `,
      width: 520,
      backdrop: false,
      focusConfirm: false,
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      customClass: {
        container: 'task-detail-swal-container',
        popup: 'users-create-modal-popup',
        title: 'users-create-modal-title',
        htmlContainer: 'users-create-modal-content',
        confirmButton: 'users-create-modal-confirm',
        cancelButton: 'users-create-modal-cancel'
      },
      preConfirm: () => {
        const value = document.getElementById('swal-checklist-pending')?.value || ''
        const title = String(value).trim()
        if (!title) {
          Swal.showValidationMessage('Debes escribir un pendiente')
          return false
        }
        return title
      }
    })

    if (!result?.isConfirmed || !result.value) return

    const title = String(result.value).trim()
    if (!title) return

    setEditableChecklist((current) => ([
      ...current,
      {
        descripcion: title,
        estado: 'PENDIENTE'
      }
    ]))
  }

  const handleSaveChecklist = async () => {
    if (typeof onSaveChecklist !== 'function') {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      const sanitizedChecklist = editableChecklist.map(normalizeChecklistItemForSave)
      const saved = await onSaveChecklist(task, sanitizedChecklist)
      if (saved !== false) {
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleChecklistStateChange = (index, nextStateKey) => {
    setEditableChecklist((current) => (
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        const updatedItem = applyChecklistStateToItem(item, nextStateKey)
        if (nextStateKey !== 'blocked') {
          return {
            ...updatedItem,
            nota: '',
            observacion: '',
            comentario: ''
          }
        }

        return updatedItem
      })
    ))
  }

  const handleChecklistBlockedNoteChange = (index, value) => {
    const shortNote = String(value || '').slice(0, 80)
    setEditableChecklist((current) => (
      current.map((item, itemIndex) => (
        itemIndex === index
          ? {
            ...item,
            nota: shortNote,
            observacion: shortNote
          }
          : item
      ))
    ))
  }

  if (!isOpen || !task) return null

  const apartmentId = getTaskApartmentId(task)
  const assignedUserId = getTaskAssignedUserId(task)
  const statusId = task?.statusId ?? task?.estadoId ?? null
  const apartmentName = apartmentId != null
    ? (apartmentNameById?.get(Number(apartmentId)) || `Apartamento ${apartmentId}`)
    : 'Sin apartamento'
  const assigneeName = assignedUserId != null
    ? (userNameById?.get(Number(assignedUserId)) || `Usuario ${assignedUserId}`)
    : 'Sin asignar'
  const statusLabel = statusId != null
    ? (statusNameById?.get(Number(statusId)) || `Estado ${statusId}`)
    : 'Sin estado'
  const dateLabel = getTaskDate(task) || 'Sin fecha'
  const dueTimeLabel = typeof getDeadLine === 'function' ? getDeadLine(getTaskType(task)) : (getTaskDueTime(task) || 'Sin hora')

  return (
    <>
      <button className="task-detail-backdrop" type="button" onClick={onClose} aria-label="Cerrar detalle de tarea" />

      <aside className="task-detail-panel" role="dialog" aria-modal="true" aria-label="Detalle de tarea">
        <header className="task-detail-header">
          <span className="task-detail-kicker">DETALLE DE TAREA</span>
          <h2 className="task-detail-title">{task?.titulo || 'Tarea sin titulo'}</h2>
          <button type="button" className="task-detail-close" onClick={onClose} aria-label="Cerrar panel">
            <X size={18} />
          </button>
        </header>

        <div className="task-detail-body">
          <section className="task-detail-grid">
            <article className="task-detail-card">
              <span className="task-detail-label">Apartamento</span>
              <p className="task-detail-value"><Building2 size={16} /> {apartmentName}</p>
            </article>

            <article className="task-detail-card">
              <span className="task-detail-label">Asignado a</span>
              <p className="task-detail-value"><UserRound size={16} /> {assigneeName}</p>
            </article>

            <article className="task-detail-card">
              <span className="task-detail-label">Fecha</span>
              <p className="task-detail-value"><CalendarDays size={16} /> {dateLabel}</p>
            </article>

            <article className="task-detail-card">
              <span className="task-detail-label">Hora limite</span>
              <p className="task-detail-value"><ClipboardClock size={16} /> {dueTimeLabel}</p>
            </article>
          </section>

          <section className="task-detail-section">
            <h3 className="task-detail-section-title">Descripcion</h3>
            <p className="task-detail-description">{task?.descripcion || 'Sin descripcion'}</p>
          </section>

          <section className="task-detail-section">
            <div className="task-detail-checklist-header">
              <h3 className="task-detail-section-title">Checklist</h3>
              <span className="task-detail-counter">{checklistDoneCount}/{editableChecklist.length}</span>
            </div>

            <div className="task-detail-checklist-adder">
              <button
                type="button"
                className="task-detail-checklist-add-btn"
                onClick={handleAddChecklistPending}
              >
                <Plus size={14} /> Agregar pendiente
              </button>
            </div>

            <div className="task-detail-checklist">
              {editableChecklist.length === 0 ? (
                <p className="task-detail-empty">Esta tarea no tiene checklist.</p>
              ) : (
                editableChecklist.map((item, index) => {
                  const state = getChecklistItemState(item)
                  const note = getChecklistItemNote(item)

                  return (
                    <article key={`${task.id}-check-${index}`} className={`task-check-item is-${state.key}`}>
                      <div className="task-check-main">
                        <p className="task-check-title"><CheckSquare size={15} /> {getChecklistItemTitle(item, index)}</p>

                        <div className="task-check-actions" role="group" aria-label="Estado del pendiente">
                          <button
                            type="button"
                            className={`task-check-action-btn ${state.key === 'pending' ? 'is-active' : ''}`}
                            onClick={() => handleChecklistStateChange(index, 'pending')}
                          >
                            Pendiente
                          </button>
                          <button
                            type="button"
                            className={`task-check-action-btn ${state.key === 'done' ? 'is-active' : ''}`}
                            onClick={() => handleChecklistStateChange(index, 'done')}
                          >
                            Completado
                          </button>
                          <button
                            type="button"
                            className={`task-check-action-btn ${state.key === 'blocked' ? 'is-active' : ''}`}
                            onClick={() => handleChecklistStateChange(index, 'blocked')}
                          >
                            Bloqueado
                          </button>
                        </div>

                        {state.key === 'blocked' ? (
                          <input
                            type="text"
                            value={note}
                            className="task-check-blocked-input"
                            maxLength={80}
                            placeholder="Motivo breve del bloqueo"
                            onChange={(event) => handleChecklistBlockedNoteChange(index, event.target.value)}
                            aria-label={`Motivo de bloqueo para ${getChecklistItemDescription(item) || `item ${index + 1}`}`}
                          />
                        ) : null}

                        {state.key !== 'blocked' && note ? <p className="task-check-note">{note}</p> : null}
                      </div>
                      <span className="task-check-state">{state.label}</span>
                    </article>
                  )
                })
              )}
            </div>
          </section>

          <section className="task-detail-section">
            <h3 className="task-detail-section-title">Estado actual</h3>
            <p className="task-detail-status">{statusLabel}</p>
          </section>
        </div>

        <footer className="task-detail-footer">
          <button type="button" className="task-detail-btn task-detail-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="task-detail-btn task-detail-btn-primary" onClick={handleSaveChecklist} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </footer>
      </aside>
    </>
  )
}
