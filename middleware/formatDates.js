// middleware/formatDates.js
function formatDatesMiddleware(req, res, next) {
  const originalJson = res.json;

  res.json = function (data) {
    const formatted = formatDatesInObject(data);
    return originalJson.call(this, formatted);
  };

  next();
}

// Função recursiva para formatar datas em objetos ou arrays
function formatDatesInObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(formatDatesInObject);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      const value = obj[key];
      if (value instanceof Date) {
        newObj[key] = value.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        newObj[key] = formatDatesInObject(value);
      }
    }
    return newObj;
  }
  return obj;
}

module.exports = formatDatesMiddleware;
