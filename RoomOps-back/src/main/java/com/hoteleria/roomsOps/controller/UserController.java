package com.hoteleria.roomsOps.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.hoteleria.roomsOps.dto.UserDto;
import com.hoteleria.roomsOps.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("api/v1/users")
@Tag(name = "Users", description = "Gestion de usuarios")
public class UserController {

    @Autowired
    private UserService service;

    @GetMapping
        @Operation(summary = "Listar usuarios", description = "Obtiene el listado completo de usuarios")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente", content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserDto.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public List<UserDto> listUsers(){
        return service.getUsers();
    }

    @PostMapping
        @Operation(summary = "Crear usuario", description = "Crea un nuevo usuario del sistema")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos del usuario a crear", content = @Content(schema = @Schema(implementation = UserDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario creado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.UserEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos invalidos", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody UserDto dto) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UserDto created = service.createUser(dto);
            resp.put("mensaje", "Usuario generado correctamente");
            resp.put("user", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            resp.put("mensaje", "Error al crear usuario");
            resp.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }
    }

    @GetMapping("/by-email")
        @Operation(summary = "Buscar usuario por email", description = "Obtiene un usuario usando su correo electronico")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario encontrado", content = @Content(schema = @Schema(implementation = UserDto.class))),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> getUser(@RequestParam String email) {
        UserDto dto = service.findByEmail(email);

        if (dto == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje","Usuario no encontrado"));
        }

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
        @Operation(summary = "Actualizar usuario", description = "Actualiza completamente un usuario existente")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos actualizados del usuario", content = @Content(schema = @Schema(implementation = UserDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario actualizado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.UserEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible actualizar el usuario", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> updateUser(@PathVariable Long id, @RequestBody UserDto dto){
        try{
            UserDto updated = service.updateUser(id, dto);
            return ResponseEntity.ok(Map.of("mensaje","Usuario actualizado","user", updated));
        } catch (Exception e){
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensaje","Error al actualizar usuario","error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado")
        @Operation(summary = "Cambiar estado de usuario", description = "Activa o desactiva un usuario")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado actualizado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible actualizar el estado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> cambiarEstado(@PathVariable Long id, @RequestParam Boolean activo){
        try{
            service.updateEstado(id, activo);
            return ResponseEntity.ok(Map.of("mensaje","Estado de usuario actualizado"));
        } catch (Exception e){
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje","Usuario no encontrado","error", e.getMessage()));
            }
            Map<String, Object> resp = new HashMap<>();
            resp.put("mensaje", "Error al actualizar estado de usuario");
            resp.put("error", e.getMessage());
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(resp);
        }
    }

    @PatchMapping("/{id}")
        @Operation(summary = "Actualizar usuario parcialmente", description = "Modifica parcialmente los campos permitidos de un usuario")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Campos editables del usuario. Los campos id, run y role se ignoran", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.PatchUserRequest.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario actualizado parcialmente", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.UserEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible parchar el usuario", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> patchUser(@PathVariable Long id, @RequestBody Map<String, Object> updates){
        try{
            updates.remove("id");
            updates.remove("run");
            updates.remove("role");

            UserDto patched = service.patchUser(id, updates);

            return ResponseEntity.ok(Map.of("mensaje","Usuario parchado","user", patched));
        } catch (Exception e){
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensaje","Error al parchado usuario","error", e.getMessage()));
        }
    }
}
