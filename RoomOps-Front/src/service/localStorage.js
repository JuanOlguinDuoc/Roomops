

// ⚠️ REMOVIDOS: Datos mockeados que interferían con autenticación real del backend
// Estos se creaban automáticamente al inicio y causaban confusión entre datos locales y reales
// Ahora solo se usan datos que vienen del backend después de login

// if (!localStorage.getItem('roles')) {
//   localStorage.setItem('roles', JSON.stringify(['admin', 'user']));
// }

// if (!localStorage.getItem('registeredUsers')) {
//   localStorage.setItem('registeredUsers', JSON.stringify([]));
// }

// if (!localStorage.getItem('nextUserId')) {
//   localStorage.setItem('nextUserId', '1');
// }

const TOKEN_KEY = 'token';

const getNextUserId = () => {
  const current = parseInt(localStorage.getItem('nextUserId') || '0', 10);
  const next = current + 1;
  localStorage.setItem('nextUserId', String(next));
  return next;
}

const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token = localStorage.getItem(TOKEN_KEY)) => {
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;

  return Date.now() >= payload.exp * 1000;
};

export const hasValidToken = (token = localStorage.getItem(TOKEN_KEY)) => {
  return !isTokenExpired(token);
};

// CRUD helpers for roles
export const getAllRoles = () => JSON.parse(localStorage.getItem('roles')) || [];

export const createRole = (role) => {
  const roles = getAllRoles();
  if (!roles.includes(role)) {
    roles.push(role);
    localStorage.setItem('roles', JSON.stringify(roles));
  }
  return roles;
}

export const deleteRole = (role) => {
  const roles = getAllRoles().filter(r => r !== role);
  localStorage.setItem('roles', JSON.stringify(roles));
  return true;
}

// CRUD helpers for registered users
export const getAllUsers = () => JSON.parse(localStorage.getItem('registeredUsers')) || [];

export const createUserAdmin = (userData) => {
  const users = getAllUsers();
  // Ensure compatibility with existing code that expects 'nombre', 'apellidos' and 'name'
  const newUser = {
    ...userData,
    id: getNextUserId(),
    registrationDate: new Date().toISOString(),
    // keep both styles: firstName/lastName and nombre/apellidos
    nombre: userData.firstName || userData.nombre || '',
    apellidos: userData.lastName || userData.apellidos || '',
    name: userData.firstName || userData.nombre || '',
    role: userData.role || 'user'
  };
  users.push(newUser);
  localStorage.setItem('registeredUsers', JSON.stringify(users));
  return newUser;
}

export const updateUserAdmin = (id, changes) => {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === parseInt(id));
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...changes };
  localStorage.setItem('registeredUsers', JSON.stringify(users));
  return users[idx];
}

export const deleteUserAdmin = (id) => {
  const users = getAllUsers().filter(u => u.id !== parseInt(id));
  localStorage.setItem('registeredUsers', JSON.stringify(users));
  return true;
}

// Funciones para manejo de sesión de usuario
export const setUserSession = (userData) => {
  // Normalizar campos del usuario que vienen del backend para la forma que usa el frontend
  const normalized = {
    id: userData?.id || null,
    run: userData?.run || userData?.rut || userData?.id || '',
    // backend usa firstName/lastName; frontend espera nombre/apellidos y name/apellido
    nombre: userData?.firstName || userData?.name || userData?.nombre || '',
    apellidos: userData?.lastName || userData?.apellidos || '',
    name: userData?.firstName || userData?.name || userData?.nombre || '',
    apellido: userData?.lastName || userData?.apellidos || '',
    email: userData?.email || '',
    role: userData?.role || '',
    telefono: userData?.telefono || userData?.phone || '',
    direccion: userData?.direccion || userData?.address || '',
    departamento: userData?.departamento || '',
    ciudad: userData?.ciudad || '',
    region: userData?.region || '',
    codigoPostal: userData?.codigoPostal || '',
    indicacionesEntrega: userData?.indicacionesEntrega || '',
    // Mantener cualquier dato original por compatibilidad
    __raw: userData
  };

  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(normalized));
  // Notificar a la UI que la sesión cambió (para que componentes se re-rendericen)
  try { window.dispatchEvent(new Event('authChanged')); } catch (e) { /* noop */ }
}

export const clearUserSession = () => {
  localStorage.setItem('isLoggedIn', 'false');
  localStorage.removeItem('currentUser');
  localStorage.removeItem(TOKEN_KEY);
  // Limpiar datos mockeados cuando se cierra sesión
  localStorage.removeItem('roles');
  localStorage.removeItem('registeredUsers');
  localStorage.removeItem('nextUserId');
  // Notificar a la UI que la sesión cambió
  try { window.dispatchEvent(new Event('authChanged')); } catch (e) { /* noop */ }
}

export const isUserLoggedIn = () => {
  const isLoggedFlag = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedFlag) return false;

  if (!hasValidToken()) {
    clearUserSession();
    return false;
  }

  return true;
}

export const getCurrentUser = () => {
  if (isUserLoggedIn()) {
    const sessionUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!sessionUser) return null;

    const token = localStorage.getItem(TOKEN_KEY);
    const payload = decodeJwtPayload(token);
    const fallbackRole = payload?.role
      || payload?.rol
      || payload?.userRole
      || (Array.isArray(payload?.roles) ? payload.roles[0] : null)
      || (Array.isArray(payload?.authorities) ? payload.authorities[0] : null)
      || null;

    const fallbackRoleNormalized = String(fallbackRole || '').replace(/^ROLE_/, '').toUpperCase();
    const mergedSession = {
      ...sessionUser,
      id: sessionUser?.id ?? payload?.userId ?? payload?.id ?? payload?.uid ?? null,
      email: sessionUser?.email || payload?.email || payload?.sub || '',
      role: sessionUser?.role || fallbackRoleNormalized || ''
    };

    // Si ya es un objeto normalizado guardado por setUserSession, devolverlo directamente
    if (mergedSession.nombre || mergedSession.email) {
      return mergedSession;
    }

    // Fallback: intentar buscar en registeredUsers por email
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    const fullUser = registeredUsers.find(user => user.email === sessionUser.email);
    if (fullUser) {
      return {
        ...fullUser,
        apellido: fullUser.apellidos,
        name: fullUser.nombre,
        loginTime: sessionUser.loginTime
      };
    }

    return mergedSession;
  }
  return null;
};

// Función para obtener el rol del usuario actual
export const getUserRole = () => {
  const user = getCurrentUser();
  if (!user) return null;

  const normalizeRole = (value) => String(value || '').trim().toUpperCase().replace(/^ROLE_/, '');
  
  // El rol puede venir del objeto role completo o como string
  if (typeof user.role === 'object' && user.role !== null) {
    return normalizeRole(user.role.name || user.role.id || null);
  }
  return normalizeRole(user.role || null);
};

// Función para verificar si el usuario es ADMINISTRADOR
export const isUserAdmin = () => {
  const role = getUserRole();
  return role === 'ADMINISTRADOR' || role === 'ADMIN';
};

// Función para verificar si el usuario es supervisor
export const isUserSupervisor = () => {
  const role = getUserRole();
  return role === 'SUPERVISOR';
};

// Función para verificar si el usuario es trabajador
export const isUserTrabajador = () => {
  const role = getUserRole();
  return role === 'TRABAJADOR' || role === 'WORKER';
};

// Función para registrar un nuevo usuario
export const registerUser = (userData) => {
  console.log('Datos recibidos para registro:', userData);

  // Obtener usuarios existentes o crear array vacío
  const existingUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
  console.log('Usuarios existentes:', existingUsers);

  // Verificar si el email ya existe
  const userEmailExists = existingUsers.find(user => user.email === userData.email);

  // Verificar RUN
  const userRunExists = existingUsers.find(user => user.run === userData.run);

  console.log('RUN a verificar:', userData.run);
  console.log('¿RUN existe?:', userRunExists);
  console.log('¿Email existe?:', userEmailExists);

  if (userRunExists) {
    return { success: false, message: 'El RUN ya está registrado' };
  }

  if (userEmailExists) {
    return { success: false, message: 'El correo ya está registrado' };
  }

  // Agregar nuevo usuario
  const newUser = {
    ...userData,
  id: getNextUserId(),
    registrationDate: new Date().toISOString(),
    role: 'user' // Por defecto todos son usuarios normales
  };

  existingUsers.push(newUser);
  localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

  // Crear sesión automáticamente después del registro exitoso
  setUserSession({
    email: newUser.email,
    name: newUser.nombre,
    run: newUser.run,
    role: newUser.role,
    loginTime: new Date().toISOString()
  });

  console.log('Usuario registrado exitosamente:', newUser);
  console.log('Sesión creada automáticamente');

  return { success: true, message: 'Usuario registrado exitosamente', user: newUser };
};

// Modificar validateLogin para incluir usuarios registrados
export const validateLogin = (email, password) => {
  // Usuarios hardcodeados (admin y test)
  const hardcodedUsers = [
    {
      email: 'admin@duoc.cl',
      password: 'admin123',
      name: 'Administrador',
      role: 'admin'
    }
  ];

  // Usuarios registrados dinámicamente
  const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

  // Combinar ambos arrays
  const allUsers = [...hardcodedUsers, ...registeredUsers];

  const user = allUsers.find(u => u.email === email && u.password === password);

  if (user) {
    setUserSession({
      email: user.email,
      name: user.name || user.nombre, // Compatibility
      role: user.role,
      loginTime: new Date().toISOString()
    });
    return { success: true, user };
  }

  return { success: false, message: 'Credenciales inválidas' };
};

// =====================================================
// APARTMENTS - CONFIGURACION LOCAL (alineada al backend)
// =====================================================
// Basado en roomsOps:
// - DTO: id, nombre, piso, activo
// - Controller: list, getById, create, update, patch parcial y patch estado

const APARTMENTS_KEY = 'apartments';
const NEXT_APARTMENT_ID_KEY = 'nextApartmentId';

const getStoredApartments = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(APARTMENTS_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveStoredApartments = (apartments) => {
  localStorage.setItem(APARTMENTS_KEY, JSON.stringify(apartments));
};

const getNextApartmentId = () => {
  const current = parseInt(localStorage.getItem(NEXT_APARTMENT_ID_KEY) || '0', 10);
  const next = current + 1;
  localStorage.setItem(NEXT_APARTMENT_ID_KEY, String(next));
  return next;
};

const normalizeApartmentDto = (dto = {}) => ({
  id: dto?.id != null ? Number(dto.id) : null,
  nombre: dto?.nombre || '',
  piso: dto?.piso != null && dto?.piso !== '' ? Number(dto.piso) : null,
  activo: typeof dto?.activo === 'boolean' ? dto.activo : true
});

// Equivalente a GET /api/v1/apartments
export const getAllApartments = () => {
  return getStoredApartments();
};

// Equivalente a GET /api/v1/apartments/{id}
export const getApartmentById = (id) => {
  const apartmentId = Number(id);
  if (!Number.isFinite(apartmentId)) return null;
  const apartments = getStoredApartments();
  return apartments.find(a => Number(a.id) === apartmentId) || null;
};

// Equivalente a POST /api/v1/apartments
// Retorna estructura similar al controller: { message, apartment }
export const createApartmentLocal = (dto) => {
  const apartments = getStoredApartments();
  const normalized = normalizeApartmentDto(dto);

  // Reglas del modelo (nullable = false para nombre, piso y activo)
  if (!normalized.nombre.trim()) {
    return { success: false, message: 'Error al crear apartamento', error: 'El nombre es obligatorio' };
  }
  if (!Number.isInteger(normalized.piso)) {
    return { success: false, message: 'Error al crear apartamento', error: 'El piso es obligatorio y debe ser numerico' };
  }

  // Regla del modelo: nombre unico
  const existsName = apartments.some(
    a => (a.nombre || '').trim().toLowerCase() === normalized.nombre.trim().toLowerCase()
  );
  if (existsName) {
    return { success: false, message: 'Error al crear apartamento', error: 'El nombre ya existe' };
  }

  const newApartment = {
    ...normalized,
    id: normalized.id ?? getNextApartmentId()
  };

  apartments.push(newApartment);
  saveStoredApartments(apartments);

  return { success: true, message: 'Apartamento creado correctamente', apartment: newApartment };
};

// Equivalente a PUT /api/v1/apartments/{id}
// Actualiza nombre y activo como en ApartmentService.updateApartment
export const updateApartmentLocal = (id, dto) => {
  const apartmentId = Number(id);
  if (!Number.isFinite(apartmentId)) {
    return { success: false, message: 'Error al actualizar apartamento', error: 'ID invalido' };
  }

  const apartments = getStoredApartments();
  const index = apartments.findIndex(a => Number(a.id) === apartmentId);

  if (index === -1) {
    return { success: false, message: 'Error al actualizar apartamento', error: 'Apartamento no encontrado' };
  }

  const normalized = normalizeApartmentDto(dto);

  if (!normalized.nombre.trim()) {
    return { success: false, message: 'Error al actualizar apartamento', error: 'El nombre es obligatorio' };
  }
  if (!Number.isInteger(normalized.piso)) {
    return { success: false, message: 'Error al actualizar apartamento', error: 'El piso es obligatorio y debe ser numerico' };
  }

  // Si cambia el nombre, validamos unicidad
  const existsName = apartments.some(
    (a, i) => i !== index && (a.nombre || '').trim().toLowerCase() === normalized.nombre.trim().toLowerCase()
  );
  if (existsName) {
    return { success: false, message: 'Error al actualizar apartamento', error: 'El nombre ya existe' };
  }

  const updated = {
    ...apartments[index],
    nombre: normalized.nombre,
    piso: normalized.piso,
    activo: normalized.activo,
    id: apartments[index].id
  };

  apartments[index] = updated;
  saveStoredApartments(apartments);

  return { success: true, message: 'Apartamento actualizado', apartment: updated };
};

// Equivalente a PATCH /api/v1/apartments/{id}
// En backend solo permite actualizar parcialmente nombre y/o piso.
export const patchApartmentLocal = (id, dto = {}) => {
  const apartmentId = Number(id);
  if (!Number.isFinite(apartmentId)) {
    return { success: false, message: 'Error al actualizar apartamento', error: 'ID invalido' };
  }

  const apartments = getStoredApartments();
  const index = apartments.findIndex(a => Number(a.id) === apartmentId);

  if (index === -1) {
    return { success: false, message: 'Error al actualizar apartamento', error: 'Apartamento no encontrado' };
  }

  let hasChanges = false;
  const next = { ...apartments[index] };

  if (dto?.nombre != null) {
    const nombre = String(dto.nombre).trim();
    if (!nombre) {
      return { success: false, message: 'Error al actualizar apartamento', error: 'El nombre no puede estar vacio' };
    }

    const existsName = apartments.some(
      (a, i) => i !== index && (a.nombre || '').trim().toLowerCase() === nombre.toLowerCase()
    );
    if (existsName) {
      return { success: false, message: 'Error al actualizar apartamento', error: 'El nombre ya existe' };
    }

    next.nombre = nombre;
    hasChanges = true;
  }

  if (dto?.piso != null) {
    const piso = Number(dto.piso);
    if (!Number.isInteger(piso)) {
      return { success: false, message: 'Error al actualizar apartamento', error: 'El piso debe ser numerico' };
    }
    next.piso = piso;
    hasChanges = true;
  }

  if (!hasChanges) {
    return {
      success: false,
      message: 'Error al actualizar apartamento',
      error: 'Debe enviar al menos nombre o piso para actualizar'
    };
  }

  apartments[index] = next;
  saveStoredApartments(apartments);

  return { success: true, message: 'Apartamento actualizado parcialmente', apartment: next };
};

// Equivalente a PATCH /api/v1/apartments/{id}/estado?activo=true|false
export const updateApartmentEstadoLocal = (id, activo) => {
  const apartmentId = Number(id);
  if (!Number.isFinite(apartmentId)) {
    return { success: false, message: 'Error al cambiar estado', error: 'ID invalido' };
  }

  const apartments = getStoredApartments();
  const index = apartments.findIndex(a => Number(a.id) === apartmentId);

  if (index === -1) {
    return { success: false, message: 'Error al cambiar estado', error: 'Apartamento no encontrado' };
  }

  apartments[index] = {
    ...apartments[index],
    activo: Boolean(activo)
  };

  saveStoredApartments(apartments);

  return { success: true, message: 'Estado actualizado', apartment: apartments[index] };
};