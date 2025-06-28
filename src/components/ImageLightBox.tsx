import { useEffect, useState } from "react";

function ImageLightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      setVisible(true);
      return () => setVisible(false);
    }, [imageUrl]);
  
    // Handle fade-out before unmount
    const [shouldRender, setShouldRender] = useState(true);
    useEffect(() => {
      if (!imageUrl) setShouldRender(false);
      else setShouldRender(true);
    }, [imageUrl]);
  
    const handleClose = () => {
      setVisible(false);
      setTimeout(() => {
        onClose();
      }, 200); // match the transition duration
    };
  
    if (!shouldRender) return null;
    return (
      <div
        className={`fixed -top-8 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      >
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow hover:bg-red-100 transition"
            aria-label="Close image preview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={imageUrl} alt="Service" className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg border-4 border-white transition-transform duration-200 scale-100" />
        </div>
      </div>
    );
  }

  export default ImageLightbox;