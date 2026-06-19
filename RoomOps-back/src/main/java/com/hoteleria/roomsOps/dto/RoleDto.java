package com.hoteleria.roomsOps.dto;

import com.hoteleria.roomsOps.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "Role", description = "Rol asignable a un usuario")
public class RoleDto {
    @Schema(description = "Identificador del rol", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Nombre del rol", example = "ADMINISTRADOR")
    private String name;

    public static RoleDto fromEntity(Role r){
    if (r == null) return null;
    return RoleDto.builder()
            .id(r.getId())
            .name(r.getName())
            .build();
    }

    public static Role toEntity(RoleDto dto){
        if (dto == null) return null;
        return Role.builder()
                .id(dto.getId())
                .name(dto.getName())
                .build();
    }
}
