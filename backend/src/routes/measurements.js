const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const router = express.Router();

// Настройка multer для загрузки фото замеров
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/measurements/');
    // Создаем папку, если её нет
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.originalname;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB максимум
  },
  fileFilter: (req, file, cb) => {
    // Проверяем тип файла
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'), false);
    }
  }
});

// Загрузка фото замеров для заказа
router.post('/upload/:orderId', upload.array('photos', 10), async (req, res) => {
  try {
    console.log('Получен запрос на загрузку фото для заказа:', req.params.orderId);
    console.log('Файлы в запросе:', req.files);
    
    const { orderId } = req.params;
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log('Файлы не загружены');
      return res.status(400).json({ message: 'Файлы не загружены' });
    }

    console.log('Количество загруженных файлов:', uploadedFiles.length);

    // Формируем информацию о загруженных файлах
    const photos = uploadedFiles.map(file => ({
      id: Date.now() + Math.round(Math.random() * 1E9),
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/measurements/${file.filename}`,
      size: file.size,
      uploadDate: new Date().toISOString()
    }));

    console.log('Сформированные данные о фото:', photos);

    // Сохраняем информацию о фото в базу данных
    const savePromises = photos.map(photo => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO measurements_photos (order_id, filename, original_name, file_path, file_size) VALUES (?, ?, ?, ?, ?)',
          [orderId, photo.filename, photo.originalName, photo.path, photo.size],
          function(err) {
            if (err) {
              console.error('Ошибка сохранения в БД:', err);
              reject(err);
            } else {
              // Обновляем ID фото на реальный ID из базы
              photo.id = this.lastID;
              resolve(photo);
            }
          }
        );
      });
    });

    try {
      await Promise.all(savePromises);
      console.log('Сохранено в БД для заказа', orderId, ':', photos.length, 'фото');

      res.json({
        message: `Загружено ${photos.length} фото`,
        photos: photos,
        orderId: orderId
      });
    } catch (error) {
      console.error('Ошибка при сохранении в БД:', error);
      res.status(500).json({ message: 'Ошибка при сохранении фото' });
    }

  } catch (error) {
    console.error('Ошибка при загрузке фото:', error);
    res.status(500).json({ message: 'Ошибка при загрузке фото' });
  }
});

// Получение фото замеров для заказа
router.get('/:orderId', (req, res) => {
  try {
    console.log('Получен запрос на получение фото для заказа:', req.params.orderId);
    const { orderId } = req.params;
    
    // Получаем фото из базы данных
    db.all(
      'SELECT id, filename, original_name, file_path, file_size, upload_date FROM measurements_photos WHERE order_id = ? ORDER BY upload_date DESC',
      [orderId],
      (err, rows) => {
        if (err) {
          console.error('Ошибка при получении фото из БД:', err);
          return res.status(500).json({ message: 'Ошибка при получении фото' });
        }

        const photos = rows.map(row => ({
          id: row.id,
          filename: row.filename,
          originalName: row.original_name,
          path: row.file_path,
          size: row.file_size,
          uploadDate: row.upload_date
        }));

        console.log('Найдено фото для заказа', orderId, ':', photos.length, 'шт.');
        
        res.json({
          orderId: orderId,
          photos: photos
        });
      }
    );

  } catch (error) {
    console.error('Ошибка при получении фото:', error);
    res.status(500).json({ message: 'Ошибка при получении фото' });
  }
});

// Удаление фото замера
router.delete('/:orderId/:photoId', (req, res) => {
  try {
    const { orderId, photoId } = req.params;
    console.log('Получен запрос на удаление фото:', photoId, 'для заказа:', orderId);
    
    // Сначала получаем информацию о фото из БД
    db.get(
      'SELECT filename FROM measurements_photos WHERE id = ? AND order_id = ?',
      [photoId, orderId],
      (err, row) => {
        if (err) {
          console.error('Ошибка при получении фото из БД:', err);
          return res.status(500).json({ message: 'Ошибка при удалении фото' });
        }

        if (!row) {
          return res.status(404).json({ message: 'Фото не найдено' });
        }

        // Удаляем файл с диска
        const filePath = path.join(__dirname, '../../uploads/measurements/', row.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Файл удален с диска:', filePath);
        }

        // Удаляем запись из БД
        db.run(
          'DELETE FROM measurements_photos WHERE id = ? AND order_id = ?',
          [photoId, orderId],
          function(err) {
            if (err) {
              console.error('Ошибка при удалении из БД:', err);
              return res.status(500).json({ message: 'Ошибка при удалении фото' });
            }

            console.log('Фото удалено из БД для заказа', orderId, '. Удалено записей:', this.changes);
            
            res.json({
              message: 'Фото удалено',
              orderId: orderId,
              photoId: photoId
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Ошибка при удалении фото:', error);
    res.status(500).json({ message: 'Ошибка при удалении фото' });
  }
});

// Delete all photos for an order (when order is completed)
router.delete('/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`Удаляем все фото для заказа ${orderId}`);

    // Получаем все фото заказа из БД
    db.all('SELECT * FROM measurements_photos WHERE order_id = ?', [orderId], (err, photos) => {
      if (err) {
        console.error('Ошибка при получении фото из БД:', err);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }

      if (photos.length === 0) {
        console.log(`Фото для заказа ${orderId} не найдены`);
        return res.json({ message: 'Фото не найдены' });
      }

      // Удаляем все файлы из файловой системы
      let deletedCount = 0;
      photos.forEach(photo => {
        const filePath = path.join(__dirname, '../../uploads/measurements/', photo.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Файл удален: ${filePath}`);
        }
      });

      // Удаляем все записи из БД
      db.run('DELETE FROM measurements_photos WHERE order_id = ?', [orderId], (err) => {
        if (err) {
          console.error('Ошибка при удалении записей из БД:', err);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }

        console.log(`Удалено ${deletedCount} файлов и ${photos.length} записей для заказа ${orderId}`);
        res.json({ 
          message: `Удалено ${deletedCount} файлов и ${photos.length} записей`,
          deletedFiles: deletedCount,
          deletedRecords: photos.length
        });
      });
    });
  } catch (error) {
    console.error('Ошибка при удалении всех фото заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
