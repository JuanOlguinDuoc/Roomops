package com.hoteleria.roomsOps.repository;

import java.util.Optional;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hoteleria.roomsOps.model.Status;

@Repository
public interface StatusRepo extends JpaRepository<Status, Long> {
    Optional<Status> findByNombre(String nombre);
}
