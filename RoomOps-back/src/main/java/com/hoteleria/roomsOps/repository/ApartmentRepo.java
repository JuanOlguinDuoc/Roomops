package com.hoteleria.roomsOps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hoteleria.roomsOps.model.Apartment;
import java.util.Optional;


@Repository
public interface ApartmentRepo extends JpaRepository<Apartment, Long>{ 

    Optional<Apartment> findByNombre(String nombre);
}
