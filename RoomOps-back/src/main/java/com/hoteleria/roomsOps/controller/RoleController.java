package com.hoteleria.roomsOps.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.hoteleria.roomsOps.service.RoleService;
import com.hoteleria.roomsOps.dto.RoleDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("api/v1/roles")
@Tag(name = "Roles", description = "Gestion de roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping
        @Operation(summary = "Listar roles", description = "Obtiene todos los roles disponibles")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente", content = @Content(array = @ArraySchema(schema = @Schema(implementation = RoleDto.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public List<RoleDto> listRoles(){
        return roleService.getRoles();
    }

    @PostMapping
        @Operation(summary = "Crear rol", description = "Crea un nuevo rol")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos del rol a crear", content = @Content(schema = @Schema(implementation = RoleDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Rol creado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.RoleEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos invalidos", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Map<String,Object>> createRole(@RequestBody RoleDto dto){
        Map<String,Object> resp = new HashMap<>();
        try{
            RoleDto created = roleService.createRole(dto);
            resp.put("mensaje", "Rol generado correctamente");
            resp.put("role", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e){
            resp.put("mensaje", "Error al crear rol");
            resp.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }
    }

    @GetMapping("/{id}")
        @Operation(summary = "Obtener rol por id", description = "Busca un rol por su identificador")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rol encontrado", content = @Content(schema = @Schema(implementation = RoleDto.class))),
            @ApiResponse(responseCode = "404", description = "Rol no encontrado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> getRole(@PathVariable Long id){
        RoleDto dto = roleService.findById(id);
        if (dto == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje","Rol no encontrado"));
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
        @Operation(summary = "Actualizar rol", description = "Actualiza completamente un rol existente")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos actualizados del rol", content = @Content(schema = @Schema(implementation = RoleDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rol actualizado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.RoleEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible actualizar el rol", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> updateRole(@PathVariable Long id, @RequestBody RoleDto dto){
        try{
            RoleDto updated = roleService.updateRole(id, dto);
            return ResponseEntity.ok(Map.of("mensaje","Rol actualizado","role", updated));
        } catch (Exception e){
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensaje","Error al actualizar rol","error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
        @Operation(summary = "Eliminar rol", description = "Elimina un rol por su identificador")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rol eliminado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible eliminar el rol", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "404", description = "Rol no encontrado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> deleteRole(@PathVariable Long id){
        try{
            roleService.deleteRole(id);
            return ResponseEntity.ok(Map.of("mensaje","Rol eliminado"));
        } catch (Exception e){

            // en caso de que sea Null, le asigno un mensaje genérico para evitar NullPointerException al acceder a getMessage()
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Error desconocido";

            if (errorMsg.toLowerCase().contains("no encontrado")) {
                return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje","Rol no encontrado","error", errorMsg));
            }
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensaje","Error al eliminar rol","error", errorMsg));
        }
    }
}

