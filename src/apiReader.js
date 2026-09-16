const BACKEND_URL = 'https://supaapi.project-ice.dk/api'

export async function login(email, password) {
    return fetchFromServer('/auth/login', {
        method: 'POST', 
        body: { email, password },
        includeAuth: false,
    })
    .then((data) => {
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


// add body to this method after backend is completed
export function IsTokenValid(token) {
  if (!token) {
    return false;
  }
    return true;
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
    throw new Error(`Request failed (${method} ${finalUrl}): ${response.status} ${errorText}`.trim())
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
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

