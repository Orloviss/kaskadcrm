// Утилиты для автоматической обработки авторизации

// Очистка cookies при ошибке авторизации
export function clearAuthCookies() {
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.crmkaskad.ru;';
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Автоматическая обработка fetch запросов с авторизацией
export async function authFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include'
  });
  
  if (response.status === 401) {
    // Автоматически очищаем cookies при ошибке 401
    clearAuthCookies();
    // Перенаправляем на страницу логина
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response;
}

// Проверка авторизации с автоматической очисткой
export async function checkAuthStatus() {
  try {
    const response = await authFetch('/api/auth/me');
    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.log('Auth check failed:', error);
  }
  return false;
} 