package com.hoteleria.roomsOps.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hoteleria.roomsOps.dto.TaskDto;
import com.hoteleria.roomsOps.service.TaskService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("api/v1/tasks")
@Tag(name = "Tasks", description = "Gestion de tareas")
public class TaskController {

	@Autowired
	private TaskService taskService;

	@GetMapping
	@Operation(summary = "Listar tareas", description = "Obtiene el listado completo de tareas")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Listado obtenido correctamente", content = @Content(array = @ArraySchema(schema = @Schema(implementation = TaskDto.class)))),
			@ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
	})
	public List<TaskDto> listTasks() {
		return taskService.getAllTasks();
	}

	@PostMapping
	@Operation(summary = "Crear tarea", description = "Crea una nueva tarea para un apartamento")
	@io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos de la tarea a crear", content = @Content(schema = @Schema(implementation = TaskDto.class)))
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Tarea creada", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.TaskEnvelopeResponse.class))),
			@ApiResponse(responseCode = "400", description = "Datos invalidos", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
			@ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
	})
	public ResponseEntity<Map<String, Object>> createTask(@RequestBody TaskDto dto) {
		Map<String, Object> response = new HashMap<>();
		try {
			TaskDto created = taskService.createTask(dto);
			response.put("mensaje", "Tarea generada correctamente");
			response.put("tarea", created);
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (Exception e) {
			response.put("mensaje", "Error al crear tarea");
			response.put("error", e.getMessage());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
		}
	}

	@GetMapping("/{id}")
	@Operation(summary = "Obtener tarea por id", description = "Busca una tarea por su identificador")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Tarea encontrada", content = @Content(schema = @Schema(implementation = TaskDto.class))),
			@ApiResponse(responseCode = "404", description = "Tarea no encontrada", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class))),
			@ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
	})
	public ResponseEntity<Object> getTask(@PathVariable Long id) {
		TaskDto dto = taskService.getTaskById(id);
		if (dto == null) {
			return ResponseEntity
					.status(HttpStatus.NOT_FOUND)
					.body(Map.of("mensaje", "Tarea no encontrada"));
		}
		return ResponseEntity.ok(dto);
	}

	@PutMapping("/{id}")
	@Operation(summary = "Actualizar tarea", description = "Actualiza completamente una tarea existente")
	@io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Datos actualizados de la tarea", content = @Content(schema = @Schema(implementation = TaskDto.class)))
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Tarea actualizada", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.TaskEnvelopeResponse.class))),
			@ApiResponse(responseCode = "400", description = "No fue posible actualizar la tarea", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
			@ApiResponse(responseCode = "404", description = "Tarea no encontrada", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class))),
			@ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
	})
	public ResponseEntity<Object> updateTask(@PathVariable Long id, @RequestBody TaskDto dto) {
		try {
			TaskDto updated = taskService.updateTask(id, dto);
			if (updated == null) {
				return ResponseEntity
						.status(HttpStatus.NOT_FOUND)
						.body(Map.of("mensaje", "Tarea no encontrada"));
			}
			return ResponseEntity.ok(Map.of("mensaje", "Tarea actualizada", "tarea", updated));
		} catch (Exception e) {
			return ResponseEntity
					.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("mensaje", "Error al actualizar tarea", "error", e.getMessage()));
		}
	}

	@DeleteMapping("/{id}")
	@Operation(summary = "Eliminar tarea", description = "Elimina una tarea por su identificador")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Tarea eliminada", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class))),
			@ApiResponse(responseCode = "400", description = "No fue posible eliminar la tarea", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.ErrorMensajeResponse.class))),
			@ApiResponse(responseCode = "401", description = "No autenticado", content = @Content)
	})
	public ResponseEntity<Object> deleteTask(@PathVariable Long id) {
		try {
			taskService.deleteTask(id);
			return ResponseEntity.ok(Map.of("mensaje", "Tarea eliminada"));
		} catch (Exception e) {
			return ResponseEntity
					.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("mensaje", "Error al eliminar tarea", "error", e.getMessage()));
		}
	}
}
