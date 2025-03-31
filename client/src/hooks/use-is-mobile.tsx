import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTouch, setIsTouch] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
      const tabletRegex = /android|ipad|playbook|silk/i;
      
      // Check for mobile or tablet user agent
      const isMobileDevice = mobileRegex.test(userAgent) || 
                           (tabletRegex.test(userAgent) && 'ontouchend' in document);
      
      // Check width as well (typical mobile threshold)
      const isMobileWidth = window.innerWidth <= 768;
      
      return isMobileDevice || isMobileWidth;
    };
    
    // Check if we have touch support
    const checkTouch = () => {
      return 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        (navigator as any).msMaxTouchPoints > 0;
    };
    
    const handleResize = () => {
      setIsMobile(checkMobile());
      setIsTouch(checkTouch());
    };
    
    // Initial check
    handleResize();
    
    // Listen for resize events to update if orientation changes
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return { isMobile, isTouch };
}