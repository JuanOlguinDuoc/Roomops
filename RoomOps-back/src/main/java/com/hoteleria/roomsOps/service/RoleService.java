package com.hoteleria.roomsOps.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hoteleria.roomsOps.model.Role;
import com.hoteleria.roomsOps.repository.RoleRepo;
import com.hoteleria.roomsOps.dto.RoleDto;

@Service
public class RoleService {
    
    @Autowired
    private RoleRepo repo;

    public List<RoleDto> getRoles(){
        return repo.findAll().stream().map(RoleDto::fromEntity).collect(Collectors.toList());
    }

    public RoleDto createRole(RoleDto dto){
        Role r = RoleDto.toEntity(dto);
        Role saved = repo.save(r);
        return RoleDto.fromEntity(saved);
    }

    public RoleDto findById(Long id){
        return repo.findById(id).map(RoleDto::fromEntity).orElse(null);
    }

    public RoleDto updateRole(Long id, RoleDto dto){
        Role existing = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));
        existing.setName(dto.getName());
        Role saved = repo.save(existing);
        return RoleDto.fromEntity(saved);
    }

    public void deleteRole(Long id){
        if (!repo.existsById(id)) {
            throw new IllegalArgumentException("Rol no encontrado");
        }
        repo.deleteById(id);
    }
}