package com.hoteleria.roomsOps.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hoteleria.roomsOps.dto.UserDto;
import com.hoteleria.roomsOps.model.Role;
import com.hoteleria.roomsOps.model.User;
import com.hoteleria.roomsOps.repository.RoleRepo;
import com.hoteleria.roomsOps.repository.UserRepo;

import org.springframework.security.crypto.password.PasswordEncoder;


@Service
public class UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;


    public List<UserDto> getUsers(){
        return userRepo.findAll().stream().map(UserDto::fromEntity).collect(Collectors.toList());
    }

    public UserDto createUser(UserDto dto) {
        User entity = UserDto.toEntity(dto);

        if (dto.getRole() == null) {
            throw new IllegalArgumentException("El Role es obligatorio");
        }

        // check duplicates
        if (userRepo.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        if (dto.getRun() != null && userRepo.existsByRun(dto.getRun())) {
            throw new IllegalArgumentException("El RUN ya está registrado");
        }

        //ahora con encriptación
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria");
        }

        entity.setPassword(passwordEncoder.encode(dto.getPassword()));

        Role role = roleRepo.findByName(dto.getRole())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + dto.getRole()));

        entity.setRole(role);
        entity.setActivo(true);

        User saved = userRepo.save(entity);
        return UserDto.fromEntity(saved);
    }

    public UserDto findById(Long id){
        return userRepo.findById(id)
                .map(UserDto::fromEntity)
                .orElse(null);
    }

    public UserDto findByEmail(String email){
        return userRepo.findByEmail(email)
                .map(UserDto::fromEntity)
                .orElse(null);
    }

    public UserDto updateUser(Long id, UserDto dto){
        User existing = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        existing.setRun(dto.getRun());
        existing.setFirstName(dto.getFirstName());
        existing.setLastName(dto.getLastName());
        existing.setEmail(dto.getEmail());

        // CON encriptación
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        if (dto.getRole() != null) {
            Role role = roleRepo.findByName(dto.getRole())
                    .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + dto.getRole()));
            existing.setRole(role);
        }

        User saved = userRepo.save(existing);
        return UserDto.fromEntity(saved);
    }

    public void updateEstado(Long id, Boolean activo){
        User existing = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        existing.setActivo(activo);
        userRepo.save(existing);
    }

    public UserDto patchUser(Long id, Map<String, Object> updates){
        User existing = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (updates.containsKey("firstName"))
            existing.setFirstName((String) updates.get("firstName"));

        if (updates.containsKey("lastName"))
            existing.setLastName((String) updates.get("lastName"));

        if (updates.containsKey("email"))
            existing.setEmail((String) updates.get("email"));

        // CON encriptación
        if (updates.containsKey("password")) {
            String password = (String) updates.get("password");
            if (password != null && !password.isEmpty()) {
                existing.setPassword(passwordEncoder.encode(password));
            }
        }

        User saved = userRepo.save(existing);
        return UserDto.fromEntity(saved);
    }

    public User findUserEmail(String email){
        return userRepo.findByEmail(email).orElse(null);
    }
}
