// Функция для форматирования чисел в российском формате
function formatCurrency(amount) {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ₽';
}

// Функция для форматирования даты в виде '19 июля 2025'
function formatDateRu(dateStr) {
  if (!dateStr) return '';
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const [year, month, day] = dateStr.split('-');
  return `${Number(day)} ${months[Number(month)-1]} ${year}`;
}

module.exports = {
  formatCurrency,
  formatDateRu
}; 