
package com.hoteleria.roomsOps.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.hoteleria.roomsOps.model.Role;
import com.hoteleria.roomsOps.model.User;
import com.hoteleria.roomsOps.model.Status;
import com.hoteleria.roomsOps.model.Apartment;
import com.hoteleria.roomsOps.repository.RoleRepo;
import com.hoteleria.roomsOps.repository.UserRepo;
import com.hoteleria.roomsOps.repository.StatusRepo;
import com.hoteleria.roomsOps.repository.ApartmentRepo;
@Component
public class Initializer implements CommandLineRunner {

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private StatusRepo statusRepo;

    @Autowired
    private ApartmentRepo apartmentRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Crear roles por defecto si no existen
        createRoleIfNotExists("ADMINISTRADOR");
        createRoleIfNotExists("SUPERVISOR");
        createRoleIfNotExists("TRABAJADOR");

        // Creacion de estados por defecto si no existen
        createStatusIfNotExists("Por Hacer");
        createStatusIfNotExists("Completado");
        createStatusIfNotExists("En progreso");
        createStatusIfNotExists("Bloqueado");

        // Crear usuarios por defecto si no existen
        createUserIfNotExists("00000000-0", "admin", "admin", "admin@duoc.cl", "admin123", "ADMINISTRADOR");
        createUserIfNotExists("00000000-1", "supervisor", "supervisor", "supervisor@duoc.cl", "supervisor123",
                "SUPERVISOR");
        createUserIfNotExists("00000000-2", "trabajador", "trabajador", "trabajador@duoc.cl", "trabajador123",
                "TRABAJADOR");

        // Completar hasta 15 usuarios de prueba
        for (int i = 3; i < 15; i++) {
            String run = String.format("%08d-%d", i, i % 10);
            String firstName = "usuario" + i;
            String lastName = "demo" + i;
            String email = "usuario" + i + "@duoc.cl";
            String password = "user" + i + "123";
            String roleName = (i % 5 == 0) ? "SUPERVISOR" : "TRABAJADOR";

            createUserIfNotExists(run, firstName, lastName, email, password, roleName);
        }

        // Crear 28 departamentos de prueba (4 torres x 7 pisos)
        char[] torres = { 'A', 'B', 'C', 'D' };
        for (char torre : torres) {
            for (int piso = 1; piso <= 7; piso++) {
                String nombre = String.format("%c%d01", torre, piso);
                createApartmentIfNotExists(nombre, piso, true);
            }
        }

        System.out.println("✓ Datos inicializados correctamente");
    }

    private void createRoleIfNotExists(String roleName) {
        if (roleRepo.findByName(roleName).isEmpty()) {
            Role role = new Role();
            role.setName(roleName);
            roleRepo.save(role);
            System.out.println("✓ Rol creado: " + roleName);
        }
    }

    private void createUserIfNotExists(String run, String firstName, String lastName, String email, String password,
            String roleName) {
        if (userRepo.findByEmail(email).isEmpty()) {
            Role role = roleRepo.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + roleName));

            User user = new User();
            user.setRun(run);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password)); // Encriptar contraseña
            user.setRole(role);
            userRepo.save(user);
            System.out.println("✓ Usuario creado: " + email + " con rol: " + roleName);
        }
    }

    private void createStatusIfNotExists(String statusName) {
        if (statusRepo.findByNombre(statusName).isEmpty()) {
            Status status = new Status();
            status.setNombre(statusName);
            statusRepo.save(status);
            System.out.println("✓ Estado creado: " + statusName);
        }
    }

    private void createApartmentIfNotExists(String name, Integer piso, Boolean activo) {
        if (apartmentRepo.findByNombre(name).isEmpty()) {
            Apartment apartment = new Apartment();
            
            apartment.setNombre(name);
            apartment.setPiso(piso);
            apartment.setActivo(activo);

            apartmentRepo.save(apartment);
            System.out.println("✓ Apartamenot creado: " + name);
        }
    }

}
