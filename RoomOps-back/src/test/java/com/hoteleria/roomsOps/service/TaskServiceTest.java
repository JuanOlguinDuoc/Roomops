package com.hoteleria.roomsOps.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.hoteleria.roomsOps.dto.TaskDto;
import com.hoteleria.roomsOps.model.Apartment;
import com.hoteleria.roomsOps.model.ChecklistItem;
import com.hoteleria.roomsOps.model.ChecklistStatus;
import com.hoteleria.roomsOps.model.Status;
import com.hoteleria.roomsOps.model.Task;
import com.hoteleria.roomsOps.model.User;
import com.hoteleria.roomsOps.repository.ApartmentRepo;
import com.hoteleria.roomsOps.repository.StatusRepo;
import com.hoteleria.roomsOps.repository.TaskRepo;
import com.hoteleria.roomsOps.repository.UserRepo;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepo taskRepo;

    @Mock
    private ApartmentRepo apartmentRepo;

    @Mock
    private UserRepo userRepo;

    @Mock
    private StatusRepo statusRepo;

    @InjectMocks
    private TaskService service;

    @Test
    void getAllTasksOk() {
        Apartment apartment = Apartment.builder().id(1L).nombre("A-101").activo(true).build();
        Status status = Status.builder().id(2L).nombre("Pendiente").build();
        User user = User.builder().id(3L).firstName("Juan").build();

        Task task = Task.builder()
                .id(10L)
                .titulo("Limpiar")
                .descripcion("Limpiar cocina")
            .tipo("LIMPIEZA")
            .prioridad("ALTA")
            .fecha(LocalDate.of(2026, 5, 6))
            .dueTime("15:00")
                .apartment(apartment)
                .status(status)
                .assignedTo(user)
                .checklist(List.of(ChecklistItem.builder().descripcion("Trapear").estado(ChecklistStatus.PENDIENTE).build()))
                .build();

        when(taskRepo.findAll()).thenReturn(List.of(task));

        List<TaskDto> result = service.getAllTasks();

        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).getId());
        assertEquals("Limpiar", result.get(0).getTitulo());
        assertEquals("LIMPIEZA", result.get(0).getTipo());
        assertEquals("ALTA", result.get(0).getPrioridad());
        assertEquals(LocalDate.of(2026, 5, 6), result.get(0).getFecha());
        assertEquals("15:00", result.get(0).getDueTime());
        assertEquals(1L, result.get(0).getApartmentId());
        assertEquals(2L, result.get(0).getStatusId());
        assertEquals(3L, result.get(0).getAssignedUserId());
        assertEquals(1, result.get(0).getChecklist().size());
    }

    @Test
    void getTaskByIdFound() {
        Apartment apartment = Apartment.builder().id(1L).build();
        Status status = Status.builder().id(2L).build();

        Task task = Task.builder()
                .id(11L)
                .titulo("Revisar")
                .descripcion("Revisar bano")
            .tipo("INSPECCION")
            .prioridad("MEDIA")
            .fecha(LocalDate.of(2026, 5, 7))
            .dueTime("16:30")
                .apartment(apartment)
                .status(status)
                .build();

        when(taskRepo.findById(11L)).thenReturn(Optional.of(task));

        TaskDto result = service.getTaskById(11L);

        assertEquals(11L, result.getId());
        assertEquals("Revisar", result.getTitulo());
        assertEquals("INSPECCION", result.getTipo());
        assertEquals("MEDIA", result.getPrioridad());
        assertEquals(LocalDate.of(2026, 5, 7), result.getFecha());
        assertEquals("16:30", result.getDueTime());
        assertEquals(1L, result.getApartmentId());
        assertEquals(2L, result.getStatusId());
    }

    @Test
    void getTaskByIdMissing() {
        when(taskRepo.findById(99L)).thenReturn(Optional.empty());

        TaskDto result = service.getTaskById(99L);

        assertNull(result);
    }

    @Test
    void createTaskOk() {
        Apartment apartment = Apartment.builder().id(1L).build();
        Status status = Status.builder().id(2L).build();
        User user = User.builder().id(3L).build();

        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .descripcion("Descripcion")
            .tipo("MANTENCION")
            .prioridad("BAJA")
            .fecha(LocalDate.of(2026, 5, 8))
            .dueTime("18:45")
                .apartmentId(1L)
                .statusId(2L)
                .assignedUserId(3L)
                .checklist(List.of(ChecklistItem.builder().descripcion("Paso 1").estado(ChecklistStatus.HECHO).build()))
                .build();

        when(apartmentRepo.findById(1L)).thenReturn(Optional.of(apartment));
        when(statusRepo.findById(2L)).thenReturn(Optional.of(status));
        when(userRepo.findById(3L)).thenReturn(Optional.of(user));
        when(taskRepo.save(any(Task.class))).thenAnswer(invocation -> {
            Task saved = invocation.getArgument(0);
            saved.setId(15L);
            return saved;
        });

        TaskDto result = service.createTask(dto);

        assertEquals(15L, result.getId());
        assertEquals("Nueva tarea", result.getTitulo());
        assertEquals("MANTENCION", result.getTipo());
        assertEquals("BAJA", result.getPrioridad());
        assertEquals(LocalDate.of(2026, 5, 8), result.getFecha());
        assertEquals("18:45", result.getDueTime());
        assertEquals(1L, result.getApartmentId());
        assertEquals(2L, result.getStatusId());
        assertEquals(3L, result.getAssignedUserId());
        assertEquals(1, result.getChecklist().size());
    }

    @Test
    void createTaskChecklistBlockedWithoutNote() {
        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .apartmentId(1L)
                .statusId(2L)
                .checklist(List.of(ChecklistItem.builder()
                        .descripcion("Paso bloqueado")
                        .estado(ChecklistStatus.BLOQUEADO)
                        .nota("   ")
                        .build()))
                .build();

        when(apartmentRepo.findById(1L)).thenReturn(Optional.of(Apartment.builder().id(1L).build()));
        when(statusRepo.findById(2L)).thenReturn(Optional.of(Status.builder().id(2L).build()));

        assertThrows(IllegalArgumentException.class, () -> service.createTask(dto));
        verify(taskRepo, never()).save(any(Task.class));
    }

    @Test
    void createTaskChecklistBlockedWithNullNote() {
        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .apartmentId(1L)
                .statusId(2L)
                .checklist(List.of(ChecklistItem.builder()
                        .descripcion("Paso bloqueado")
                        .estado(ChecklistStatus.BLOQUEADO)
                        .nota(null)
                        .build()))
                .build();

        when(apartmentRepo.findById(1L)).thenReturn(Optional.of(Apartment.builder().id(1L).build()));
        when(statusRepo.findById(2L)).thenReturn(Optional.of(Status.builder().id(2L).build()));

        assertThrows(IllegalArgumentException.class, () -> service.createTask(dto));
        verify(taskRepo, never()).save(any(Task.class));
    }

    @Test
    void createTaskRequiresApartmentId() {
        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .statusId(2L)
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.createTask(dto));

        assertTrue(ex.getMessage().contains("apartamento"));
        verify(taskRepo, never()).save(any(Task.class));
    }

    @Test
    void createTaskRequiresStatusId() {
        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .apartmentId(1L)
                .build();

        when(apartmentRepo.findById(1L)).thenReturn(Optional.of(Apartment.builder().id(1L).build()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.createTask(dto));

        assertTrue(ex.getMessage().contains("estado"));
        verify(taskRepo, never()).save(any(Task.class));
    }

    @Test
    void createTaskApartmentNotFound() {
        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .apartmentId(999L)
                .statusId(2L)
                .build();

        when(apartmentRepo.findById(999L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.createTask(dto));

        assertTrue(ex.getMessage().contains("Apartamento no encontrado"));
        verify(taskRepo, never()).save(any(Task.class));
    }

    @Test
    void createTaskStatusNotFound() {
        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .apartmentId(1L)
                .statusId(999L)
                .build();

        when(apartmentRepo.findById(1L)).thenReturn(Optional.of(Apartment.builder().id(1L).build()));
        when(statusRepo.findById(999L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.createTask(dto));

        assertTrue(ex.getMessage().contains("Estado no encontrado"));
        verify(taskRepo, never()).save(any(Task.class));
    }

    @Test
    void createTaskAssignedUserNotFound() {
        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .apartmentId(1L)
                .statusId(2L)
                .assignedUserId(999L)
                .build();

        when(apartmentRepo.findById(1L)).thenReturn(Optional.of(Apartment.builder().id(1L).build()));
        when(statusRepo.findById(2L)).thenReturn(Optional.of(Status.builder().id(2L).build()));
        when(userRepo.findById(999L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.createTask(dto));

        assertTrue(ex.getMessage().contains("Usuario asignado no encontrado"));
        verify(taskRepo, never()).save(any(Task.class));
    }

    @Test
    void createTaskHandlesNullChecklist() {
        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .apartmentId(1L)
                .statusId(2L)
                .checklist(null)
                .build();

        when(apartmentRepo.findById(1L)).thenReturn(Optional.of(Apartment.builder().id(1L).build()));
        when(statusRepo.findById(2L)).thenReturn(Optional.of(Status.builder().id(2L).build()));
        when(taskRepo.save(any(Task.class))).thenAnswer(invocation -> {
            Task saved = invocation.getArgument(0);
            saved.setId(16L);
            return saved;
        });

        TaskDto result = service.createTask(dto);

        assertEquals(16L, result.getId());
        assertEquals(0, result.getChecklist().size());
    }

    @Test
    void createTaskAllowsNullChecklistItemAndBlockedWithNote() {
        List<ChecklistItem> checklist = new ArrayList<>();
        checklist.add(null);
        checklist.add(ChecklistItem.builder()
            .descripcion("Paso bloqueado")
            .estado(ChecklistStatus.BLOQUEADO)
            .nota("Falta insumo")
            .build());

        TaskDto dto = TaskDto.builder()
                .titulo("Nueva tarea")
                .apartmentId(1L)
                .statusId(2L)
            .checklist(checklist)
                .build();

        when(apartmentRepo.findById(1L)).thenReturn(Optional.of(Apartment.builder().id(1L).build()));
        when(statusRepo.findById(2L)).thenReturn(Optional.of(Status.builder().id(2L).build()));
        when(taskRepo.save(any(Task.class))).thenAnswer(invocation -> {
            Task saved = invocation.getArgument(0);
            saved.setId(17L);
            return saved;
        });

        TaskDto result = service.createTask(dto);

        assertEquals(17L, result.getId());
        assertEquals(2, result.getChecklist().size());
        assertNull(result.getChecklist().get(0));
        assertEquals(ChecklistStatus.BLOQUEADO, result.getChecklist().get(1).getEstado());
        assertEquals("Falta insumo", result.getChecklist().get(1).getNota());
    }

    @Test
    void updateTaskFound() {
        Apartment apartment = Apartment.builder().id(1L).build();
        Apartment newApartment = Apartment.builder().id(5L).build();
        Status status = Status.builder().id(2L).build();
        Status newStatus = Status.builder().id(6L).build();
        User existingUser = User.builder().id(3L).build();

        Task existing = Task.builder()
                .id(20L)
                .titulo("Antigua")
                .descripcion("Vieja")
                .apartment(apartment)
                .status(status)
                .assignedTo(existingUser)
                .build();

        TaskDto request = TaskDto.builder()
                .titulo("Actualizada")
                .descripcion("Nueva")
            .tipo("INSPECCION")
            .prioridad("URGENTE")
            .fecha(LocalDate.of(2026, 5, 9))
            .dueTime("10:15")
                .apartmentId(5L)
                .statusId(6L)
                .checklist(List.of(ChecklistItem.builder().descripcion("Paso").estado(ChecklistStatus.EN_PROGRESO).build()))
                .build();

        when(taskRepo.findById(20L)).thenReturn(Optional.of(existing));
        when(apartmentRepo.findById(5L)).thenReturn(Optional.of(newApartment));
        when(statusRepo.findById(6L)).thenReturn(Optional.of(newStatus));
        when(taskRepo.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskDto result = service.updateTask(20L, request);

        assertEquals(20L, result.getId());
        assertEquals("Actualizada", result.getTitulo());
        assertEquals("INSPECCION", result.getTipo());
        assertEquals("URGENTE", result.getPrioridad());
        assertEquals(LocalDate.of(2026, 5, 9), result.getFecha());
        assertEquals("10:15", result.getDueTime());
        assertEquals(5L, result.getApartmentId());
        assertEquals(6L, result.getStatusId());
        assertEquals(3L, result.getAssignedUserId());
        assertEquals(1, result.getChecklist().size());
    }

    @Test
    void updateTaskMissingReturnsNull() {
        when(taskRepo.findById(404L)).thenReturn(Optional.empty());

        TaskDto result = service.updateTask(404L, TaskDto.builder().titulo("X").build());

        assertNull(result);
    }

    @Test
    void updateTaskKeepsRelationsWhenIdsAreNull() {
        Apartment apartment = Apartment.builder().id(1L).build();
        Status status = Status.builder().id(2L).build();
        User existingUser = User.builder().id(3L).build();

        Task existing = Task.builder()
                .id(21L)
                .titulo("Antigua")
                .descripcion("Vieja")
                .apartment(apartment)
                .status(status)
                .assignedTo(existingUser)
                .build();

        TaskDto request = TaskDto.builder()
                .titulo("Actualizada")
                .descripcion("Nueva")
                .checklist(List.of(ChecklistItem.builder().descripcion("Paso").estado(ChecklistStatus.HECHO).build()))
                .build();

        when(taskRepo.findById(21L)).thenReturn(Optional.of(existing));
        when(taskRepo.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskDto result = service.updateTask(21L, request);

        assertEquals(1L, result.getApartmentId());
        assertEquals(2L, result.getStatusId());
        assertEquals(3L, result.getAssignedUserId());
    }

    @Test
    void deleteTaskOk() {
        service.deleteTask(9L);
        verify(taskRepo).deleteById(9L);
    }
}
