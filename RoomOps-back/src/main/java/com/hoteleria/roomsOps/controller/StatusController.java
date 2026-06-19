package com.hoteleria.roomsOps.controller;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.hoteleria.roomsOps.service.StatusService;
import com.hoteleria.roomsOps.dto.StatusDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("api/v1/status")
@Tag(name = "Status", description = "Gestion de estados")
public class StatusController {
    
    @Autowired
    private StatusService service;

    @GetMapping
        @Operation(summary = "Listar estados", description = "Obtiene todos los estados disponibles para tareas")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente", content = @Content(array = @ArraySchema(schema = @Schema(implementation = StatusDto.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public List<StatusDto> listStatus(){
        return service.getAllStatus();
    }

    @PostMapping
        @Operation(summary = "Crear estado", description = "Crea un nuevo estado de tarea")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos del estado a crear", content = @Content(schema = @Schema(implementation = StatusDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Estado creado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.StatusEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos invalidos", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Map<String,Object>> createStatus(@RequestBody StatusDto dto){
        Map<String,Object> resp = new HashMap<>();
        try{
            StatusDto created = service.createStatus(dto);
            resp.put("message", "Estado generado correctamente");
            resp.put("status", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e){
            resp.put("message", "Error al crear estado");
            resp.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);    
        }
    }
     
    @GetMapping("/{id}")
        @Operation(summary = "Obtener estado por id", description = "Busca un estado por su identificador")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado encontrado", content = @Content(schema = @Schema(implementation = StatusDto.class))),
            @ApiResponse(responseCode = "404", description = "Estado no encontrado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> getStatus(@PathVariable Long id){
        StatusDto dto = service.getStatusById(id);
        if (dto == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("message","Estado no encontrado"));
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
        @Operation(summary = "Actualizar estado", description = "Actualiza completamente un estado existente")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos actualizados del estado", content = @Content(schema = @Schema(implementation = StatusDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado actualizado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.StatusEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible actualizar el estado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> updateStatus(@PathVariable Long id, @RequestBody StatusDto dto){
        try{
            StatusDto updated = service.updateStatus(id, dto);
            return ResponseEntity.ok(Map.of("message","Estado actualizado","status", updated));
        } catch (Exception e){
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message","Error al actualizar estado", "error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
        @Operation(summary = "Eliminar estado", description = "Elimina un estado por su identificador")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado eliminado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible eliminar el estado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Map<String,String>> deleteStatus(@PathVariable Long id){
        try{
            service.deleteStatus(id);
            return ResponseEntity.ok(Map.of("message","Estado eliminado correctamente"));
        } catch (Exception e){
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message","Error al eliminar estado", "error", e.getMessage()));
        }
    }
}