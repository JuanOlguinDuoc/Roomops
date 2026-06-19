package com.hoteleria.roomsOps.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hoteleria.roomsOps.model.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "User", description = "Usuario del sistema")
public class UserDto {

    @Schema(description = "Identificador del usuario", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "RUN del usuario", example = "12345678-9")
    private String run;

    @Schema(description = "Nombre del usuario", example = "Juan")
    private String firstName;

    @Schema(description = "Apellido del usuario", example = "Perez")
    private String lastName;

    @Schema(description = "Correo electronico del usuario", example = "juan@duoc.cl")
    private String email;

    @Schema(description = "Indica si el usuario se encuentra activo", example = "true")
    private Boolean activo;

    //RECORDATORIO: ESTO SOLO RECIBE PERO NO MUESTRA EN LAS RESPUESTAS
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Schema(description = "Contrasena del usuario. Solo se acepta en requests", example = "secreto123", accessMode = Schema.AccessMode.WRITE_ONLY)
    private String password;

    @Schema(description = "Nombre del rol asignado", example = "SUPERVISOR")
    private String role;

    public static UserDto fromEntity(User u){
        if (u == null) {
            return null;
        }

        return UserDto.builder()
                .id(u.getId())
                .run(u.getRun())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .activo(u.getActivo())
                .role(u.getRole() != null ? u.getRole().getName() : null)
                .build();
    }

    public static User toEntity(UserDto dto){
        if (dto == null) {
            return null;
        }

        return User.builder()
                .id(dto.getId())
                .run(dto.getRun())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .password(dto.getPassword())
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                // role se asigna en el service
                .build();
    }
}
