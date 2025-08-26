/**
 * CSRF-aware fetch wrapper that automatically handles token refresh and retry
 */

interface CSRFFetchOptions extends RequestInit {
  // Extends standard RequestInit options
}

/**
 * Fetches a fresh CSRF token from the server
 */
async function fetchFreshCSRFToken(): Promise<string> {
  const response = await fetch('/api/csrf/token');
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  const data = await response.json();
  return data.csrfToken;
}

/**
 * CSRF-aware fetch wrapper that automatically:
 * 1. Adds CSRF token to requests (both header and form data if applicable)
 * 2. Retries once with fresh token if CSRF validation fails
 * 3. Works with both JSON and FormData payloads
 */
export async function csrfFetch(
  url: string,
  options: CSRFFetchOptions = {}
): Promise<Response> {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  const method = (options.method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return fetch(url, options);
  }

  // Get initial CSRF token
  let csrfToken: string;
  try {
    csrfToken = await fetchFreshCSRFToken();
  } catch (error) {
    throw new Error('Failed to get CSRF token for request');
  }

  // Helper function to add CSRF token to request
  const addCSRFToRequest = (
    token: string,
    originalOptions: CSRFFetchOptions
  ) => {
    const headers = new Headers(originalOptions.headers);

    // Always add to header
    headers.set('x-csrf-token', token);

    // Add to form data if it's a FormData body
    let body = originalOptions.body;
    if (body instanceof FormData) {
      // Clone FormData and add token
      const newFormData = new FormData();
      for (const [key, value] of body.entries()) {
        newFormData.append(key, value);
      }
      newFormData.append('csrfToken', token);
      body = newFormData;
    }

    return {
      ...originalOptions,
      headers,
      body,
    };
  };

  // First attempt
  let requestOptions = addCSRFToRequest(csrfToken, options);
  let response = await fetch(url, requestOptions);

  // If CSRF validation fails, refresh token and retry once
  if (response.status === 403) {
    try {
      const errorData = await response.clone().json();
      if (errorData.code === 'CSRF_TOKEN_INVALID') {
        console.log('CSRF token expired, refreshing and retrying...', {
          url,
          method,
        });

        // Get fresh token
        const freshToken = await fetchFreshCSRFToken();

        // Retry with fresh token
        requestOptions = addCSRFToRequest(freshToken, options);
        response = await fetch(url, requestOptions);

        console.log('CSRF retry completed', {
          url,
          method,
          success: response.ok,
          status: response.status,
        });
      }
    } catch (parseError) {
      // If we can't parse the error response, return the original response
      console.warn('Failed to parse CSRF error response:', parseError);
    }
  }

  return response;
}

/**
 * Convenience wrapper for JSON POST requests
 */
export async function csrfPostJSON(
  url: string,
  data: any,
  options: CSRFFetchOptions = {}
): Promise<Response> {
  return csrfFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * Convenience wrapper for form data POST requests
 */
export async function csrfPostFormData(
  url: string,
  formData: FormData,
  options: CSRFFetchOptions = {}
): Promise<Response> {
  return csrfFetch(url, {
    method: 'POST',
    body: formData,
    ...options,
  });
}

/**
 * Convenience wrapper for DELETE requests
 */
export async function csrfDelete(
  url: string,
  options: CSRFFetchOptions = {}
): Promise<Response> {
  return csrfFetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}

/**
 * Convenience wrapper for PATCH requests
 */
export async function csrfPatch(
  url: string,
  data: any,
  options: CSRFFetchOptions = {}
): Promise<Response> {
  return csrfFetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });
}
