import React, { useState, useRef, useEffect } from 'react';
import './MeasurementsModal.scss';
const { API_BASE_URL, UPLOADS_BASE_URL } = require('../config');

function MeasurementsModal({ onClose, orderId }) {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Загружаем сохраненные фото при открытии модального окна
  useEffect(() => {
    loadPhotos();
  }, [orderId]);

  const loadPhotos = async () => {
    try {
      console.log('Загружаем фото для заказа:', orderId);
      const response = await fetch(`${API_BASE_URL}/measurements/${orderId}`, { credentials: 'include' });
      console.log('Статус ответа загрузки:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Данные загруженных фото:', data);
        
        // Исправляем кодировку названий фото
        const fixedPhotos = (data.photos || []).map(photo => ({
          ...photo,
          originalName: fixFileName(photo.originalName)
        }));
        
        setPhotos(fixedPhotos);
      } else {
        console.error('Ошибка при загрузке фото, статус:', response.status);
        const errorData = await response.json().catch(() => ({ message: 'Неизвестная ошибка' }));
        console.error('Данные об ошибке загрузки:', errorData);
      }
    } catch (error) {
      console.error('Ошибка при загрузке фото:', error);
    }
  };

  // Функция для исправления кодировки названий файлов
  const fixFileName = (fileName) => {
    try {
      // Пытаемся исправить кодировку для кириллических символов
      return decodeURIComponent(escape(fileName));
    } catch (e) {
      // Если не получается, возвращаем оригинальное название
      return fileName;
    }
  };

  // Функция для сжатия фото
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Устанавливаем максимальные размеры
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = img;
        
        // Вычисляем новые размеры с сохранением пропорций
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Рисуем сжатое изображение
        ctx.drawImage(img, 0, 0, width, height);
        
        // Конвертируем в Blob с качеством 0.8
        canvas.toBlob((blob) => {
          // Создаем новый файл с сжатым изображением
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    try {
      // Сжимаем все фото перед загрузкой
      const compressedFiles = await Promise.all(
        files
          .filter(file => file.type.startsWith('image/'))
          .map(file => compressImage(file))
      );

      const formData = new FormData();
      compressedFiles.forEach(file => {
        formData.append('photos', file);
      });

      const response = await fetch(`${API_BASE_URL}/measurements/upload/${orderId}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ответ сервера:', data);
        
        // Исправляем кодировку названий фото
        const fixedPhotos = data.photos.map(photo => ({
          ...photo,
          originalName: fixFileName(photo.originalName)
        }));
        
        // Добавляем новые фото к существующим
        setPhotos(prev => [...prev, ...fixedPhotos]);
        alert(`Загружено ${fixedPhotos.length} фото`);
      } else {
        console.error('Статус ответа:', response.status);
        const errorData = await response.json().catch(() => ({ message: 'Неизвестная ошибка' }));
        console.error('Данные об ошибке:', errorData);
        alert(`Ошибка загрузки: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Ошибка при загрузке фото:', error);
      alert(`Ошибка при загрузке фото: ${error.message}`);
    }
  };



  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/measurements/${orderId}/${photoId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Удаляем фото из состояния
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      } else {
        alert('Ошибка при удалении фото');
      }
    } catch (error) {
      console.error('Ошибка при удалении фото:', error);
      alert('Ошибка при удалении фото');
    }
  };

  const savePhotos = () => {
    // Фото уже сохранены на сервере при загрузке
    alert(`В системе ${photos.length} фото для заказа №${orderId}`);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="measurements-modal">
        <div className="modal-header">
          <h3>Замеры заказа №{orderId}</h3>
          <div className="header-info">
            <span className="photo-count">{photos.length} фото</span>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="modal-content">
          <div className="upload-section">
            <button 
              className="upload-btn"
              onClick={() => fileInputRef.current.click()}
            >
              + Добавить фото
            </button>
            <p className="upload-hint">
              Поддерживаются форматы: JPG, PNG, GIF. Фото будут автоматически сжаты.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {photos.length > 0 && (
            <div className="photos-section">
              <h4>Загруженные фото ({photos.length})</h4>
              <div className="photos-grid">
                {photos.map(photo => (
                  <div key={photo.id} className="photo-item">
                    <img
                      src={`${UPLOADS_BASE_URL}${photo.path.startsWith('/uploads') ? photo.path.substring('/uploads'.length) : photo.path}`}
                      alt={photo.originalName}
                      onClick={() => handlePhotoClick(photo)}
                    />
                    <div className="photo-info">
                      <span className="photo-name">{photo.originalName}</span>
                      <span className="photo-size">
                        {(photo.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      className="delete-photo-btn"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button className="save-btn" onClick={savePhotos}>
            Сохранить
          </button>
        </div>
      </div>

            {/* Модальное окно для просмотра фото на весь экран */}
      {selectedPhoto && (
        <div className="photo-viewer-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-viewer-content">
            {/* Кнопка "Назад" */}
            {photos.length > 1 && (
              <button 
                className="nav-btn prev-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
                  const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
                  setSelectedPhoto(photos[prevIndex]);
                }}
              >
                ‹
              </button>
            )}

            <img
              src={`${UPLOADS_BASE_URL}${selectedPhoto.path.startsWith('/uploads') ? selectedPhoto.path.substring('/uploads'.length) : selectedPhoto.path}`}
              alt={selectedPhoto.originalName}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Кнопка "Вперед" */}
            {photos.length > 1 && (
              <button 
                className="nav-btn next-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
                  const nextIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
                  setSelectedPhoto(photos[nextIndex]);
                }}
              >
                ›
              </button>
            )}

            {/* Счетчик фото */}
            {photos.length > 1 && (
              <div className="photo-counter">
                {photos.findIndex(p => p.id === selectedPhoto.id) + 1} / {photos.length}
              </div>
            )}

            <div className="photo-viewer-info">
              <span>{selectedPhoto.originalName}</span>
              <span>Размер: {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeasurementsModal;
