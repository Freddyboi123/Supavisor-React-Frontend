export function decodeJWT(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * True when the employee is the logged-in user. `user` is the decoded JWT payload.
 * Older tokens carry no userId, so those fall back to comparing emails.
 */
export function isCurrentUser(user, employee) {
  if (!user || !employee) return false;
  if (user.userId != null) return user.userId === employee.id;
  return !!user.email && user.email.toLowerCase() === (employee.email ?? '').toLowerCase();
}

/**
 * Returns the JWT payload for the logged-in user, or null if not logged in.
 * @returns {object|null}
 */
export function getUserFromToken() {
  const token = localStorage.getItem('jwtToken');
  return decodeJWT(token);
}
