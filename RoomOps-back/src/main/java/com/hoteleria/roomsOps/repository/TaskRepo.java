package com.hoteleria.roomsOps.repository;

import java.util.Optional;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.hoteleria.roomsOps.model.Task;

@Repository
public interface TaskRepo extends JpaRepository<Task, Long> {
    Optional<Task> findByTitulo(String titulo);
}