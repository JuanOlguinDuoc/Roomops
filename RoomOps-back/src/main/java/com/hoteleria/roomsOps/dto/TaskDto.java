package com.hoteleria.roomsOps.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.hoteleria.roomsOps.model.ChecklistItem;
import com.hoteleria.roomsOps.model.Task;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "Task", description = "Tarea asociada a un apartamento")
public class TaskDto {
    @Schema(description = "Identificador de la tarea", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Titulo de la tarea", example = "Limpiar bano")
    private String titulo;

    @Schema(description = "Descripcion detallada de la tarea", example = "Realizar limpieza profunda del bano principal")
    private String descripcion;

    @Schema(description = "Tipo de tarea", example = "LIMPIEZA")
    private String tipo;

    @Schema(description = "Prioridad de la tarea", example = "ALTA")
    private String prioridad;

    @Schema(description = "Fecha programada de ejecucion", example = "2026-05-18")
    private LocalDate fecha;

    @JsonAlias("horaLimite")
    @Schema(description = "Hora limite en formato HH:mm", example = "14:00")
    private String dueTime;

    @JsonProperty("apartamentoId")
    @JsonAlias("apartmentId")
    @Schema(description = "Identificador del apartamento asociado", example = "1")
    private Long apartmentId;

    @JsonProperty("usuarioAsignadoId")
    @JsonAlias("assignedUserId")
    @Schema(description = "Identificador del usuario asignado", example = "2")
    private Long assignedUserId;

    @JsonProperty("estadoId")
    @JsonAlias("statusId")
    @Schema(description = "Identificador del estado de la tarea", example = "3")
    private Long statusId;

    @Builder.Default
    @JsonProperty("listaVerificacion")
    @JsonAlias("checklist")
    @Schema(description = "Lista de verificacion asociada a la tarea")
    private List<ChecklistItem> checklist = new ArrayList<>();

    public static TaskDto fromEntity(Task t){
        if (t == null) return null;
        return TaskDto.builder()
                .id(t.getId())
                .titulo(t.getTitulo())
                .descripcion(t.getDescripcion())
                .tipo(t.getTipo())
                .prioridad(t.getPrioridad())
                .fecha(t.getFecha())
                .dueTime(t.getDueTime())
            .apartmentId(t.getApartment() != null ? t.getApartment().getId() : null)
            .assignedUserId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null)
            .statusId(t.getStatus() != null ? t.getStatus().getId() : null)
            .checklist(t.getChecklist() == null ? new ArrayList<>() : t.getChecklist().stream()
                .map(TaskDto::copyChecklistItem)
                .collect(Collectors.toList()))
                .build();
    }

    public static Task toEntity(TaskDto dto){
        if (dto == null) return null;
        return Task.builder()
                .id(dto.getId())
                .titulo(dto.getTitulo())
                .descripcion(dto.getDescripcion())
            .tipo(dto.getTipo())
            .prioridad(dto.getPrioridad())
            .fecha(dto.getFecha())
            .dueTime(dto.getDueTime())
                .checklist(dto.getChecklist() == null ? new ArrayList<>() : dto.getChecklist().stream()
                        .map(TaskDto::copyChecklistItem)
                        .collect(Collectors.toList()))
                .build();
    }

    private static ChecklistItem copyChecklistItem(ChecklistItem item) {
        if (item == null) {
            return null;
        }

        return ChecklistItem.builder()
                .descripcion(item.getDescripcion())
                .estado(item.getEstado())
                .nota(item.getNota())
                .build();
    }
}

