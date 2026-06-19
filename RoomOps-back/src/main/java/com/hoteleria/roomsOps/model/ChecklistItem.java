package com.hoteleria.roomsOps.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import io.swagger.v3.oas.annotations.media.Schema;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "ChecklistItem", description = "Item de la lista de verificacion de una tarea")
public class ChecklistItem {

    @Schema(description = "Descripcion del item", example = "Reponer toallas")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Schema(description = "Estado del item", example = "PENDIENTE", allowableValues = { "PENDIENTE", "EN_PROGRESO", "HECHO", "BLOQUEADO" })
    private ChecklistStatus estado;

    @Schema(description = "Nota adicional del item", example = "Faltan toallas grandes")
    private String nota;
}
