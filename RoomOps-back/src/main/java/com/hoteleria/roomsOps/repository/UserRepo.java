package com.hoteleria.roomsOps.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hoteleria.roomsOps.model.User;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {
	boolean existsByEmail(String email);
	boolean existsByRun(String run);
	Optional<User> findByRun(String run);
	Optional<User> findByEmail(String email);

}