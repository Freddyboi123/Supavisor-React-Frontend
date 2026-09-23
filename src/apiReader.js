const BACKEND_URL = 'https://supaapi.project-ice.dk/api'

export async function login(email, password) {
    return fetchFromServer('/auth/login', {
        method: 'POST', 
        body: { email, password },
        includeAuth: false,
    })
    .then((data) => {
        console.log
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    })
}

export function logout() {
  //localStorage.removeItem('jwtToken')
  //localStorage.removeItem('user')
  //localStorage.clear() 
}



export function IsTokenValid(token) {
  return fetchFromServer('/auth/token-validation', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    includeAuth: false,
  }).then(() => true).catch(() => false);
}

export async function fetchEmployeesFromAPI(tenantId) {
  return fetchFromServer(`/user/tenant/${encodeURIComponent(tenantId)}`, {
    method: 'GET',
  });
}


export async function updateEmployeeInAPI(updatedEmployee) {
  return fetchFromServer(`/user/update/`, {
  
    method: 'PUT',
    body: { 
      id: updatedEmployee.id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      phoneNumber: updatedEmployee.phoneNumber,
      tenantId: updatedEmployee.tenantId,

     },
  });
}

// Creates a user in the administrator's tenant. systemRole is 'ADMIN' or 'USER';
// customRoleIds are ids of the company's own roles. Resolves to { user, temporaryPassword }.
export async function createUserInAPI({ name, email, systemRole, customRoleIds }) {
  return fetchFromServer('/user/create', {
    method: 'POST',
    body: { name, email, roles: [systemRole], customRoleIds },
  });
}

// The company's own (user defined) roles, e.g. kitchen or cleaning.
export async function fetchRolesFromAPI(tenantId) {
  return fetchFromServer(`/role/tenant/${encodeURIComponent(tenantId)}`, {
    method: 'GET',
  });
}

export async function createRoleInAPI(roleName) {
  return fetchFromServer('/role/', {
    method: 'POST',
    body: { roleName },
  });
}

export async function deleteRoleInAPI(roleId) {
  return fetchFromServer(`/role/${encodeURIComponent(roleId)}`, {
    method: 'DELETE',
  });
}

// Assignments: the recurring kinds of work an administrator defines for the company.
// Administrators get every assignment (deactivated ones included); pass activeOnly to get only the selectable ones.
export async function fetchAssignmentsFromAPI({ activeOnly = false } = {}) {
  return fetchFromServer(`/assignment/all${activeOnly ? '?activeOnly=true' : ''}`, {
    method: 'GET',
  });
}

export async function fetchEmployeeCategoriesFromAPI({ activeOnly = false } = {}) {
  return fetchFromServer(`/employee-category/all${activeOnly ? '?activeOnly=true' : ''}`, {
    method: 'GET',
  });
}

export async function assignPrimaryCategoryInAPI(userId, primaryCategoryId) {
  return fetchFromServer(`/user/${encodeURIComponent(userId)}/primary-category`, {
    method: 'PUT',
    body: { primaryCategoryId },
  });
}

// An assignment is a template: { name, address, estimatedMinutes, cost, assignedEmployeeId }.
// Only the name is required; the other details may be null.
export async function createAssignmentInAPI(assignment) {
  return fetchFromServer('/assignment', {
    method: 'POST',
    body: assignment,
  });
}

// Replaces the name and ALL details: a detail that is left out or null is cleared on the server.
// The active flag is not touched (use activate / deactivate for that).
export async function updateAssignmentInAPI(id, assignment) {
  return fetchFromServer(`/assignment/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: assignment,
  });
}

export async function deactivateAssignmentInAPI(id) {
  return fetchFromServer(`/assignment/${encodeURIComponent(id)}/deactivate`, {
    method: 'PATCH',
  });
}

export async function activateAssignmentInAPI(id) {
  return fetchFromServer(`/assignment/${encodeURIComponent(id)}/activate`, {
    method: 'PATCH',
  });
}

// Rejected with 409 while the assignment is still in use; deactivate it instead.
export async function deleteAssignmentInAPI(id) {
  return fetchFromServer(`/assignment/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// TODO: deactivate the user with this id on the backend
export async function deactivateUserInAPI(employeeId) {
  return fetchFromServer(`/user/reversActivtion/${encodeURIComponent(employeeId)}`, {
    method: 'PUT'
  });
}











// The API answers errors as {"status":..., "msg":"..."}; pull out the msg when it is there.
function extractServerMessage(errorText) {
  try {
    const msg = JSON.parse(errorText)?.msg
    return typeof msg === 'string' && msg ? msg : null
  } catch {
    return errorText || null
  }
}

// Message that is fit to show a user, falling back to the technical one.
export function getErrorMessage(error) {
  return error?.serverMessage ?? error?.message ?? 'Something went wrong'
}

export async function fetchFromServer(url, options = {}) {
  const {
    includeAuth: includeAuthOption,
    method: optionMethod,
    headers: optionHeaders,
    body: optionBody,
    ...restOptions
  } = options

  const method = (optionMethod ?? 'GET').toUpperCase()
  const headers = optionHeaders ?? {} 
  const shouldIncludeAuth = includeAuthOption ?? true


  if (shouldIncludeAuth) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      throw new Error('No JWT token available. Login first or provide a token.')
    }
    headers.Authorization = `Bearer ${token}`
  }

  let body = optionBody
  const hasBody = body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD'

  if (hasBody && typeof body !== 'string') {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    body = JSON.stringify(body)
  }

  const requestOptions = {
    ...restOptions,
    method,
    headers,
  }

  if (hasBody) {
    requestOptions.body = body
  } 

  const finalUrl = /^https?:\/\//.test(url) // If url starts with http:// or https://, treat as absolute URL //forklar forstår ikke
    ? url
    : `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`

  const response = await fetch(finalUrl, requestOptions)

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    const error = new Error(`Request failed (${method} ${finalUrl}): ${response.status} ${errorText}`.trim())
    error.status = response.status
    error.serverMessage = extractServerMessage(errorText)
    throw error
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }
  if (response.headers.has('X-Refresh-Token')) {
    const newToken = response.headers.get('X-Refresh-Token')
    localStorage.setItem('jwtToken', newToken)
  }
  return response.text() 
  //Forstår ikke helt hvorfor vi returnere text 
  // men det er fordi at hvis det ikke er json så kan det være en fejlbesked eller lignende som bare er tekst,
  //  og så vil vi gerne have den tekst tilbage i stedet for at prøve at parse det som json og så fejle. 
  // Det er en fallback for at håndtere ikke-json svar på en mere robust måde.
}
