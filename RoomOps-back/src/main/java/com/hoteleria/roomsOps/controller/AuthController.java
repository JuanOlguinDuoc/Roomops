package com.hoteleria.roomsOps.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hoteleria.roomsOps.config.JwtUtil;
import com.hoteleria.roomsOps.dto.UserDto;
import com.hoteleria.roomsOps.model.User;
import com.hoteleria.roomsOps.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("api/v1/auth")
@Tag(name = "Auth", description = "Autenticacion y obtencion de JWT")
public class AuthController {

 @Autowired
 private UserService service;

 @Autowired
 private PasswordEncoder encoder;

 @Autowired
 private JwtUtil jwt;

 @PostMapping("/login")
 @Operation(summary = "Iniciar sesion", description = "Autentica un usuario y devuelve un token JWT", security = {})
 @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Credenciales del usuario", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.AuthLoginRequest.class)))
 @ApiResponses({
   @ApiResponse(responseCode = "200", description = "Autenticacion exitosa", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.AuthLoginResponse.class))),
   @ApiResponse(responseCode = "400", description = "Email o password faltantes", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class))),
   @ApiResponse(responseCode = "401", description = "Credenciales invalidas", content = @Content(schema = @Schema(implementation = com.hoteleria.roomsOps.config.ApiSchemas.MensajeResponse.class)))
 })
 public ResponseEntity<Object> login(@RequestBody Map<String, String> payload) {
  String email = payload.get("email");
  String password = payload.get("password");

  if (email == null || password == null || email.isBlank() || password.isBlank()) {
   return ResponseEntity
     .status(HttpStatus.BAD_REQUEST)
     .body(Map.of("mensaje", "Email y password son requeridos"));
  }

  User user = service.findUserEmail(email);
  if (user == null || !encoder.matches(password, user.getPassword())) {
   return ResponseEntity
     .status(HttpStatus.UNAUTHORIZED)
     .body(Map.of("mensaje", "Credenciales inválidas"));
  }

  String token = jwt.generadorToken(user.getEmail());

  UserDto responseUser = UserDto.fromEntity(user);

  Map<String, Object> resp = new HashMap<>();
  resp.put("token", token);
  resp.put("user", responseUser);

  return ResponseEntity.ok(resp);
 }

}
