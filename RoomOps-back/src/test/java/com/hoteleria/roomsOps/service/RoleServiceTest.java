package com.hoteleria.roomsOps.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.hoteleria.roomsOps.dto.RoleDto;
import com.hoteleria.roomsOps.model.Role;
import com.hoteleria.roomsOps.repository.RoleRepo;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepo repo;

    @InjectMocks
    private RoleService service;

    @Test
    void listRoles() {
        Role role = Role.builder().id(1L).name("ADMIN").build();
        when(repo.findAll()).thenReturn(List.of(role));

        List<RoleDto> result = service.getRoles();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals("ADMIN", result.get(0).getName());
    }

    @Test
    void createRole() {
        RoleDto dto = RoleDto.builder().name("SUPERVISOR").build();
        Role saved = Role.builder().id(10L).name("SUPERVISOR").build();
        when(repo.save(any(Role.class))).thenReturn(saved);

        RoleDto result = service.createRole(dto);

        assertEquals(10L, result.getId());
        assertEquals("SUPERVISOR", result.getName());
    }

    @Test
    void findByIdFound() {
        Role role = Role.builder().id(2L).name("USER").build();
        when(repo.findById(2L)).thenReturn(Optional.of(role));

        RoleDto result = service.findById(2L);

        assertEquals(2L, result.getId());
        assertEquals("USER", result.getName());
    }

    @Test
    void findByIdMissing() {
        when(repo.findById(99L)).thenReturn(Optional.empty());

        RoleDto result = service.findById(99L);

        assertEquals(null, result);
    }

    @Test
    void updateRole() {
        Role existing = Role.builder().id(3L).name("OLD").build();
        RoleDto dto = RoleDto.builder().name("NEW").build();

        when(repo.findById(3L)).thenReturn(Optional.of(existing));
        when(repo.save(any(Role.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RoleDto result = service.updateRole(3L, dto);

        assertEquals(3L, result.getId());
        assertEquals("NEW", result.getName());
    }

    @Test
    void updateRoleMissing() {
        RoleDto dto = RoleDto.builder().name("NEW").build();
        when(repo.findById(77L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.updateRole(77L, dto));

        assertTrue(ex.getMessage().contains("Rol no encontrado"));
    }

    @Test
    void deleteRole() {
        when(repo.existsById(4L)).thenReturn(true);

        service.deleteRole(4L);

        verify(repo).deleteById(4L);
    }

    @Test
    void deleteRoleMissing() {
        when(repo.existsById(55L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.deleteRole(55L));

        assertTrue(ex.getMessage().contains("Rol no encontrado"));
        verify(repo, never()).deleteById(any(Long.class));
    }
}
