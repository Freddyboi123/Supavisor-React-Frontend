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
 * Returns the JWT payload for the logged-in user, or null if not logged in.
 * @returns {object|null}
 */
export function getUserFromToken() {
  const token = localStorage.getItem('jwtToken');
  console.log('Retrieved JWT Token:', token); // Debugging line
  return decodeJWT(token);
}
