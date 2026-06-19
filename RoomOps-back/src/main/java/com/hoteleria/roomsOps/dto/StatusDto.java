package com.hoteleria.roomsOps.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.hoteleria.roomsOps.model.Status;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "Status", description = "Estado disponible para una tarea")
public class StatusDto {
    @Schema(description = "Identificador del estado", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Nombre del estado", example = "En progreso")
    private String nombre;

    public static StatusDto fromEntity(Status s){
        if (s == null) return null;
        return StatusDto.builder()
                .id(s.getId())
                .nombre(s.getNombre())
                .build();
    }

    public static Status toEntity(StatusDto dto){
        if (dto == null) return null;
        return Status.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .build();
    }
}
