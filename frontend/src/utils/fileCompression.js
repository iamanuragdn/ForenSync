import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const showToast = (message, type = 'error') => {
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.padding = '12px 24px';
  toast.style.backgroundColor = type === 'error' ? '#ff4d4f' : type === 'info' ? '#3b82f6' : '#52c41a';
  toast.style.color = '#fff';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.zIndex = '9999';
  toast.style.fontFamily = 'Inter, sans-serif';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = '500';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s ease';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, type === 'info' ? 5000 : 3000); // info toasts stay a bit longer
};

const rasterizePDF = async (arrayBuffer, originalName) => {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  // Check if it's text-based by looking for significant text in first few pages
  let totalTextLen = 0;
  const pagesToCheck = Math.min(3, pdf.numPages);
  
  for (let i = 1; i <= pagesToCheck; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const textStr = textContent.items.map(item => item.str).join('');
    totalTextLen += textStr.trim().length;
  }
  
  // If there's more than 500 characters in the first few pages, it's likely a text PDF, not a scan
  const isScanned = totalTextLen < 500; 

  if (!isScanned) {
    // If it's a text-based PDF, rasterizing will destroy text quality and might increase size.
    // Fall back to original pdf-lib saving logic (metadata stripping & stream compression)
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return new File([pdfBytes], originalName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
  }

  // It's a scanned PDF: Rasterize each page and compress
  showToast('Compressing scanned PDF. This might take a moment...', 'info');
  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    
    // Scale 1.1 offers a good balance between readability and file size for standard A4
    const viewport = page.getViewport({ scale: 1.1 });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Apply grayscale filter to strip RGB data and drastically reduce final payload
    ctx.filter = 'grayscale(100%)';

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert to JPEG with aggressive 0.45 quality for massive size reduction
    const quality = 0.45; 
    const imgDataUrl = canvas.toDataURL('image/jpeg', quality);

    // Fetch the data URL to get the array buffer
    const res = await fetch(imgDataUrl);
    const jpgImageBytes = await res.arrayBuffer();
    
    // Embed the JPEG into the new PDF and draw it
    const jpgImage = await newPdf.embedJpg(jpgImageBytes);
    const pdfPage = newPdf.addPage([viewport.width, viewport.height]);
    
    pdfPage.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  const pdfBytes = await newPdf.save({ useObjectStreams: true });
  return new File([pdfBytes], originalName, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
};

export const uploadWithCompression = async (file) => {
  if (!file) return file;

  // Global strict size cap
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    showToast('File too large. Please upload a file under 10MB.', 'error');
    throw new Error('FILE_TOO_LARGE');
  }

  const fileType = file.type;

  try {
    // 1. Client-Side Image Compression
    if (fileType.startsWith('image/')) {
      const options = {
        maxSizeMB: 0.4, // Compress to ~400KB max
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      
      const compressedBlob = await imageCompression(file, options);
      return new File([compressedBlob], file.name, {
        type: fileType,
        lastModified: Date.now(),
      });
    }
    
    // 2. Global PDF Optimization
    if (fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      // Use rasterization for scanned PDFs, or fallback to metadata stripping
      return await rasterizePDF(arrayBuffer, file.name);
    }

    return file;

  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
};
