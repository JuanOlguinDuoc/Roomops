package com.hoteleria.roomsOps.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Estados permitidos para un item de checklist")
public enum ChecklistStatus {
    PENDIENTE,
    EN_PROGRESO,
    HECHO,
    BLOQUEADO
}
