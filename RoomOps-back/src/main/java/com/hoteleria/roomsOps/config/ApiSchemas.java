package com.hoteleria.roomsOps.config;

import com.hoteleria.roomsOps.dto.ApartmentDto;
import com.hoteleria.roomsOps.dto.RoleDto;
import com.hoteleria.roomsOps.dto.StatusDto;
import com.hoteleria.roomsOps.dto.TaskDto;
import com.hoteleria.roomsOps.dto.UserDto;

import io.swagger.v3.oas.annotations.media.Schema;

public final class ApiSchemas {

    private ApiSchemas() {
    }

    @Schema(name = "AuthLoginRequest", description = "Credenciales requeridas para iniciar sesion")
    public static class AuthLoginRequest {
        @Schema(description = "Correo del usuario", example = "admin@duoc.cl", requiredMode = Schema.RequiredMode.REQUIRED)
        public String email;

        @Schema(description = "Contrasena del usuario", example = "admin123", requiredMode = Schema.RequiredMode.REQUIRED)
        public String password;
    }

    @Schema(name = "AuthLoginResponse", description = "Respuesta exitosa de autenticacion")
    public static class AuthLoginResponse {
        @Schema(description = "Token JWT para usar en Authorization: Bearer <token>", example = "eyJhbGciOiJIUzI1NiJ9...")
        public String token;

        @Schema(description = "Usuario autenticado")
        public UserDto user;
    }

    @Schema(name = "PatchUserRequest", description = "Campos editables para una actualizacion parcial de usuario")
    public static class PatchUserRequest {
        @Schema(description = "Nombre del usuario", example = "Maria")
        public String firstName;

        @Schema(description = "Apellido del usuario", example = "Gonzalez")
        public String lastName;

        @Schema(description = "Correo electronico del usuario", example = "maria@duoc.cl")
        public String email;

        @Schema(description = "Estado activo del usuario", example = "true")
        public Boolean activo;

        @Schema(description = "Contrasena del usuario", example = "nuevaClave123")
        public String password;
    }

    @Schema(name = "MessageResponse", description = "Respuesta simple con mensaje")
    public static class MessageResponse {
        @Schema(example = "Operacion realizada correctamente")
        public String message;
    }

    @Schema(name = "MensajeResponse", description = "Respuesta simple con mensaje")
    public static class MensajeResponse {
        @Schema(example = "Operacion realizada correctamente")
        public String mensaje;
    }

    @Schema(name = "ErrorMessageResponse", description = "Respuesta de error con detalle")
    public static class ErrorMessageResponse {
        @Schema(example = "Error al procesar la solicitud")
        public String message;

        @Schema(example = "Detalle tecnico del error")
        public String error;
    }

    @Schema(name = "ErrorMensajeResponse", description = "Respuesta de error con detalle")
    public static class ErrorMensajeResponse {
        @Schema(example = "Error al procesar la solicitud")
        public String mensaje;

        @Schema(example = "Detalle tecnico del error")
        public String error;
    }

    @Schema(name = "ApartmentEnvelopeResponse", description = "Respuesta con mensaje y apartamento")
    public static class ApartmentEnvelopeResponse {
        @Schema(example = "Apartamento creado correctamente")
        public String message;

        public ApartmentDto apartment;
    }

    @Schema(name = "RoleEnvelopeResponse", description = "Respuesta con mensaje y rol")
    public static class RoleEnvelopeResponse {
        @Schema(example = "Rol generado correctamente")
        public String mensaje;

        public RoleDto role;
    }

    @Schema(name = "StatusEnvelopeResponse", description = "Respuesta con mensaje y estado")
    public static class StatusEnvelopeResponse {
        @Schema(example = "Estado generado correctamente")
        public String message;

        public StatusDto status;
    }

    @Schema(name = "TaskEnvelopeResponse", description = "Respuesta con mensaje y tarea")
    public static class TaskEnvelopeResponse {
        @Schema(example = "Tarea generada correctamente")
        public String mensaje;

        public TaskDto tarea;
    }

    @Schema(name = "UserEnvelopeResponse", description = "Respuesta con mensaje y usuario")
    public static class UserEnvelopeResponse {
        @Schema(example = "Usuario generado correctamente")
        public String mensaje;

        public UserDto user;
    }
}