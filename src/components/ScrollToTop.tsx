import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Компонент для автоматического скролла вверх при переходе на главную страницу
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Скроллим вверх при переходе на главную страницу
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
