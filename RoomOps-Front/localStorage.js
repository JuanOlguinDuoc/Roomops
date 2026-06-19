

if (!localStorage.getItem('roles')) {
  localStorage.setItem('roles', JSON.stringify(['admin', 'user']));
}

if (!localStorage.getItem('registeredUsers')) {
  localStorage.setItem('registeredUsers', JSON.stringify([]));
}

// Initialize a persistent incremental ID for users to avoid very large timestamp-based IDs
if (!localStorage.getItem('nextUserId')) {
  localStorage.setItem('nextUserId', '1');
}

const getNextUserId = () => {
  const current = parseInt(localStorage.getItem('nextUserId') || '1', 10);
  const next = current + 1;
  localStorage.setItem('nextUserId', String(next));
  return current;
}

// CRUD helpers for roles
export const getAllRoles = () => JSON.parse(localStorage.getItem('roles')) || ['admin', 'user'];

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
  // Notificar a la UI que la sesión cambió
  try { window.dispatchEvent(new Event('authChanged')); } catch (e) { /* noop */ }
}

export const isUserLoggedIn = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
}

export const getCurrentUser = () => {
  if (isUserLoggedIn()) {
    const sessionUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (!sessionUser) return null;

    // Si ya es un objeto normalizado guardado por setUserSession, devolverlo directamente
    if (sessionUser.nombre || sessionUser.email) {
      return sessionUser;
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

    return sessionUser;
  }
  return null;
};

// Función para obtener el rol del usuario actual
export const getUserRole = () => {
  const user = getCurrentUser();
  if (!user) return null;
  
  // El rol puede venir del objeto role completo o como string
  if (typeof user.role === 'object' && user.role !== null) {
    return user.role.name || user.role.id || null;
  }
  return user.role || null;
};

// Función para verificar si el usuario es administrador
export const isUserAdmin = () => {
  const role = getUserRole();
  return role === 'administrador' || role === 'admin';
};

// Función para verificar si el usuario es vendedor
export const isUserVendedor = () => {
  const role = getUserRole();
  return role === 'vendedor';
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