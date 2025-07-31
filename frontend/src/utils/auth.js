// Утилиты для автоматической обработки авторизации

// Очистка cookies при ошибке авторизации
function clearAuthCookies() {
  console.log('🔄 Автоматически очищаем cookies из-за ошибки авторизации...');
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.crmkaskad.ru;';
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  console.log('✅ Cookies очищены');
}

// Автоматическая обработка fetch запросов с авторизацией
async function authFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include'
  });
  
  if (response.status === 401) {
    console.log('🚨 Получена ошибка 401 - неавторизованный запрос');
    // Автоматически очищаем cookies при ошибке 401
    clearAuthCookies();
    // Перенаправляем на страницу логина
    console.log('🔄 Перенаправляем на страницу логина...');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response;
}

// Проверка авторизации с автоматической очисткой
async function checkAuthStatus() {
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

module.exports = {
  clearAuthCookies,
  authFetch,
  checkAuthStatus
}; 