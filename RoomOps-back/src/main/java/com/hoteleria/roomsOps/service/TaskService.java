package com.hoteleria.roomsOps.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

@Service
public class TaskService {
    @Autowired
    private TaskRepo taskRepo;

    @Autowired
    private ApartmentRepo apartmentRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private StatusRepo statusRepo;

    public List<TaskDto> getAllTasks() {
        return taskRepo.findAll().stream()
                .map(TaskDto::fromEntity)
                .collect(Collectors.toList());
    }

    public TaskDto getTaskById(Long id) {
        return taskRepo.findById(id)
                .map(TaskDto::fromEntity)
                .orElse(null);
    }

    public TaskDto createTask(TaskDto taskDto) {
        Task task = TaskDto.toEntity(taskDto);
        applyRelations(task, taskDto, true);
        task.setChecklist(copyChecklist(taskDto.getChecklist()));
        task = taskRepo.save(task);
        return TaskDto.fromEntity(task);
    }

    public TaskDto updateTask(Long id, TaskDto taskDto) {
        return taskRepo.findById(id)
                .map(existingTask -> {
                    existingTask.setTitulo(taskDto.getTitulo());
                    existingTask.setDescripcion(taskDto.getDescripcion());
                    existingTask.setTipo(taskDto.getTipo());
                    existingTask.setPrioridad(taskDto.getPrioridad());
                    existingTask.setFecha(taskDto.getFecha());
                    existingTask.setDueTime(taskDto.getDueTime());
                    applyRelations(existingTask, taskDto, false);
                    existingTask.setChecklist(copyChecklist(taskDto.getChecklist()));
                    existingTask = taskRepo.save(existingTask);
                    return TaskDto.fromEntity(existingTask);
                })
                .orElse(null);
    }

    public void deleteTask(Long id) {
        taskRepo.deleteById(id);
    }

    private void applyRelations(Task task, TaskDto taskDto, boolean creating) {
        if (creating || taskDto.getApartmentId() != null) {
            task.setApartment(resolveApartment(taskDto.getApartmentId()));
        }

        if (creating || taskDto.getStatusId() != null) {
            task.setStatus(resolveStatus(taskDto.getStatusId()));
        }

        if (taskDto.getAssignedUserId() != null) {
            task.setAssignedTo(resolveUser(taskDto.getAssignedUserId()));
        }
    }

    private Apartment resolveApartment(Long apartmentId) {
        if (apartmentId == null) {
            throw new IllegalArgumentException("El id del apartamento es obligatorio");
        }

        return apartmentRepo.findById(apartmentId)
                .orElseThrow(() -> new IllegalArgumentException("Apartamento no encontrado: " + apartmentId));
    }

    private Status resolveStatus(Long statusId) {
        if (statusId == null) {
            throw new IllegalArgumentException("El id del estado es obligatorio");
        }

        return statusRepo.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Estado no encontrado: " + statusId));
    }

    private User resolveUser(Long assignedUserId) {
        return userRepo.findById(assignedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario asignado no encontrado: " + assignedUserId));
    }

    private List<ChecklistItem> copyChecklist(List<ChecklistItem> checklist) {
        if (checklist == null) {
            return new ArrayList<>();
        }

        return checklist.stream()
                .map(this::validateAndCopyChecklistItem)
                .collect(Collectors.toList());
    }

    private ChecklistItem validateAndCopyChecklistItem(ChecklistItem item) {
        if (item == null) {
            return null;
        }

        if (item.getEstado() == ChecklistStatus.BLOQUEADO && (item.getNota() == null || item.getNota().isBlank())) {
            throw new IllegalArgumentException("La nota es requerida cuando el checklist esta BLOQUEADO");
        }

        return ChecklistItem.builder()
                .descripcion(item.getDescripcion())
                .estado(item.getEstado())
                .nota(item.getNota())
                .build();
    }
}

