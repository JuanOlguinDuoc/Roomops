package com.hoteleria.roomsOps.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.hoteleria.roomsOps.dto.ApartmentDto;
import com.hoteleria.roomsOps.service.ApartmentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("api/v1/apartments")
@Tag(name = "Apartments", description = "Gestion de apartamentos")
public class ApartmentController {

    @Autowired
    private ApartmentService apartmentService;

    @GetMapping
        @Operation(summary = "Listar apartamentos", description = "Obtiene el listado completo de apartamentos registrados")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente", content = @Content(array = @ArraySchema(schema = @Schema(implementation = ApartmentDto.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public List<ApartmentDto> listApartments(){
        return apartmentService.getApartments();
    }

    @PostMapping
        @Operation(summary = "Crear apartamento", description = "Crea un nuevo apartamento")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos del apartamento a crear", content = @Content(schema = @Schema(implementation = ApartmentDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Apartamento creado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ApartmentEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos invalidos", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Map<String,Object>> createApartment(@RequestBody ApartmentDto dto){
        Map<String,Object> resp = new HashMap<>();
        try{
            ApartmentDto created = apartmentService.createApartment(dto);
            resp.put("message", "Apartamento creado correctamente");
            resp.put("apartment", created);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e){
            resp.put("message", "Error al crear apartamento");
            resp.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }
    }

    @GetMapping("/{id}")
        @Operation(summary = "Obtener apartamento por id", description = "Busca un apartamento por su identificador")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apartamento encontrado", content = @Content(schema = @Schema(implementation = ApartmentDto.class))),
            @ApiResponse(responseCode = "404", description = "Apartamento no encontrado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> getApartment(@Parameter(description = "Identificador del apartamento", example = "1") @PathVariable Long id){
        ApartmentDto dto = apartmentService.findById(id);
        if (dto == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("message","Apartamento no encontrado"));
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
        @Operation(summary = "Actualizar apartamento", description = "Reemplaza completamente los datos de un apartamento existente")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos actualizados del apartamento", content = @Content(schema = @Schema(implementation = ApartmentDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apartamento actualizado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ApartmentEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible actualizar el apartamento", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> updateApartment(@Parameter(description = "Identificador del apartamento", example = "1") @PathVariable Long id, @RequestBody ApartmentDto dto){
        try{
            ApartmentDto updated = apartmentService.updateApartment(id, dto);
            return ResponseEntity.ok(
                Map.of("message","Apartamento actualizado","apartment", updated)
            );
        } catch (Exception e){
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message","Error al actualizar apartamento","error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
        @Operation(summary = "Actualizar parcialmente apartamento", description = "Modifica parcialmente los datos de un apartamento")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Campos del apartamento a modificar", content = @Content(schema = @Schema(implementation = ApartmentDto.class)))
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apartamento actualizado parcialmente", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ApartmentEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible actualizar el apartamento", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
    public ResponseEntity<Object> patchApartment(@Parameter(description = "Identificador del apartamento", example = "1") @PathVariable Long id, @RequestBody ApartmentDto dto){
        try{
            ApartmentDto updated = apartmentService.patchApartment(id, dto);
            return ResponseEntity.ok(
                Map.of("message","Apartamento actualizado parcialmente","apartment", updated)
            );
        } catch (Exception e){
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message","Error al actualizar apartamento","error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado")
        @Operation(summary = "Cambiar estado de apartamento", description = "Activa o desactiva un apartamento")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado actualizado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ApartmentEnvelopeResponse.class))),
            @ApiResponse(responseCode = "400", description = "No fue posible cambiar el estado", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
        })
        public ResponseEntity<Object> cambiarEstado(
            @Parameter(description = "Identificador del apartamento", example = "1") @PathVariable Long id,
            @Parameter(description = "Nuevo estado del apartamento", example = "false") @RequestParam Boolean activo){
        try {
            ApartmentDto updated = apartmentService.updateEstado(id, activo);
            return ResponseEntity.ok(
                Map.of("message", "Estado actualizado", "apartment", updated)
            );
        } catch (Exception e){
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message","Error al cambiar estado","error", e.getMessage()));
        }
    }


}
