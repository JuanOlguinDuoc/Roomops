package com.hoteleria.roomsOps.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoteleria.roomsOps.config.JwtAuthenticationFilter;
import com.hoteleria.roomsOps.dto.TaskDto;
import com.hoteleria.roomsOps.service.TaskService;

@WebMvcTest(TaskController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper mapper;

    @MockBean
    private TaskService service;

        @MockBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void listTasksOk() throws Exception {
        when(service.getAllTasks()).thenReturn(List.of(
                TaskDto.builder().id(1L).titulo("T1").descripcion("D1").tipo("LIMPIEZA").prioridad("ALTA").fecha(LocalDate.of(2026, 5, 6)).dueTime("11:00").build(),
                TaskDto.builder().id(2L).titulo("T2").descripcion("D2").tipo("INSPECCION").prioridad("MEDIA").fecha(LocalDate.of(2026, 5, 7)).dueTime("12:00").build()));

        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].titulo").value("T1"))
                .andExpect(jsonPath("$[0].tipo").value("LIMPIEZA"))
                .andExpect(jsonPath("$[0].prioridad").value("ALTA"))
                .andExpect(jsonPath("$[0].fecha").value("2026-05-06"))
                .andExpect(jsonPath("$[0].dueTime").value("11:00"))
                .andExpect(jsonPath("$[1].titulo").value("T2"));
    }

    @Test
    void createTaskCreated() throws Exception {
        TaskDto request = TaskDto.builder()
                .titulo("Tarea nueva")
                .descripcion("Detalle")
                .tipo("MANTENCION")
                .prioridad("ALTA")
                .fecha(LocalDate.of(2026, 5, 8))
                .dueTime("15:00")
                .apartmentId(1L)
                .statusId(2L)
                .build();

        TaskDto created = TaskDto.builder()
                .id(10L)
                .titulo("Tarea nueva")
                .descripcion("Detalle")
                .tipo("MANTENCION")
                .prioridad("ALTA")
                .fecha(LocalDate.of(2026, 5, 8))
                .dueTime("15:00")
                .apartmentId(1L)
                .statusId(2L)
                .build();

        when(service.createTask(any(TaskDto.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mensaje").value("Tarea generada correctamente"))
                .andExpect(jsonPath("$.tarea.id").value(10))
                .andExpect(jsonPath("$.tarea.titulo").value("Tarea nueva"))
                .andExpect(jsonPath("$.tarea.tipo").value("MANTENCION"))
                .andExpect(jsonPath("$.tarea.prioridad").value("ALTA"))
                .andExpect(jsonPath("$.tarea.fecha").value("2026-05-08"))
                .andExpect(jsonPath("$.tarea.dueTime").value("15:00"));
    }

    @Test
    void createTaskBadRequest() throws Exception {
        TaskDto request = TaskDto.builder().titulo("X").build();

        when(service.createTask(any(TaskDto.class))).thenThrow(new IllegalArgumentException("Datos invalidos"));

        mockMvc.perform(post("/api/v1/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Error al crear tarea"))
                .andExpect(jsonPath("$.error").value("Datos invalidos"));
    }

    @Test
    void getTaskOk() throws Exception {
        when(service.getTaskById(5L)).thenReturn(TaskDto.builder().id(5L).titulo("T5").tipo("INSPECCION").prioridad("MEDIA").fecha(LocalDate.of(2026, 5, 10)).dueTime("13:00").build());

        mockMvc.perform(get("/api/v1/tasks/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.titulo").value("T5"))
                .andExpect(jsonPath("$.tipo").value("INSPECCION"))
                .andExpect(jsonPath("$.prioridad").value("MEDIA"))
                .andExpect(jsonPath("$.fecha").value("2026-05-10"))
                .andExpect(jsonPath("$.dueTime").value("13:00"));
    }

    @Test
    void getTaskNotFound() throws Exception {
        when(service.getTaskById(99L)).thenReturn(null);

        mockMvc.perform(get("/api/v1/tasks/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("Tarea no encontrada"));
    }

    @Test
    void updateTaskOk() throws Exception {
        TaskDto request = TaskDto.builder().titulo("Nueva").descripcion("Desc").tipo("LIMPIEZA").prioridad("URGENTE").fecha(LocalDate.of(2026, 5, 11)).dueTime("09:30").build();
        TaskDto updated = TaskDto.builder().id(7L).titulo("Nueva").descripcion("Desc").tipo("LIMPIEZA").prioridad("URGENTE").fecha(LocalDate.of(2026, 5, 11)).dueTime("09:30").build();

        when(service.updateTask(eq(7L), any(TaskDto.class))).thenReturn(updated);

        mockMvc.perform(put("/api/v1/tasks/7")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Tarea actualizada"))
                .andExpect(jsonPath("$.tarea.id").value(7))
                .andExpect(jsonPath("$.tarea.titulo").value("Nueva"))
                .andExpect(jsonPath("$.tarea.tipo").value("LIMPIEZA"))
                .andExpect(jsonPath("$.tarea.prioridad").value("URGENTE"))
                .andExpect(jsonPath("$.tarea.fecha").value("2026-05-11"))
                .andExpect(jsonPath("$.tarea.dueTime").value("09:30"));
    }

    @Test
    void updateTaskNotFound() throws Exception {
        TaskDto request = TaskDto.builder().titulo("Nueva").build();
        when(service.updateTask(eq(8L), any(TaskDto.class))).thenReturn(null);

        mockMvc.perform(put("/api/v1/tasks/8")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("Tarea no encontrada"));
    }

    @Test
    void updateTaskBadRequest() throws Exception {
        TaskDto request = TaskDto.builder().titulo("Nueva").build();
        when(service.updateTask(eq(7L), any(TaskDto.class))).thenThrow(new IllegalArgumentException("Error update"));

        mockMvc.perform(put("/api/v1/tasks/7")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Error al actualizar tarea"))
                .andExpect(jsonPath("$.error").value("Error update"));
    }

    @Test
    void deleteTaskOk() throws Exception {
        doNothing().when(service).deleteTask(3L);

        mockMvc.perform(delete("/api/v1/tasks/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Tarea eliminada"));
    }

    @Test
    void deleteTaskBadRequest() throws Exception {
        doThrow(new IllegalArgumentException("No se puede")).when(service).deleteTask(3L);

        mockMvc.perform(delete("/api/v1/tasks/3"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("Error al eliminar tarea"))
                .andExpect(jsonPath("$.error").value("No se puede"));
    }
}
