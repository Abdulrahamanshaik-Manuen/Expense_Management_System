import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

/**
 * Converts an img element's src to a base64 data URL by fetching it.
 * Bypasses CORS by fetching the image as a blob first.
 */
async function imgToBase64(imgEl) {
  try {
    const src = imgEl.src;
    if (!src || src.startsWith('data:')) return; // Already base64, skip

    const res = await fetch(src, { mode: 'cors' });
    if (!res.ok) return;
    const blob = await res.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    imgEl.src = base64;
    imgEl.crossOrigin = null;
  } catch (e) {
    // If fetch fails, hide the image to avoid taint errors
    console.warn('Could not convert image to base64, hiding it for capture:', imgEl.src, e);
    imgEl.style.display = 'none';
  }
}

/**
 * Captures any DOM element as a pixel-perfect PDF and triggers download.
 *
 * @param {HTMLElement} element   - The DOM element to capture (the "paper sheet" div)
 * @param {string}      filename  - Filename without extension (e.g. "INV-001")
 * @param {Function}    onStart   - Called before capture starts (e.g. setDownloading(true))
 * @param {Function}    onEnd     - Called after download or on error (e.g. setDownloading(false))
 */
export async function capturePreviewAsPDF(element, filename = 'document', onStart, onEnd) {
  if (!element) {
    alert('Preview element not found. Please open the preview first.');
    return;
  }

  try {
    if (onStart) onStart();

    // Let React finish any pending renders
    await new Promise((r) => setTimeout(r, 150));

    // ── Step 1: Clone the element so we can mutate images without affecting the live UI
    const clone = element.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-9999';
    // Increase logo sizes for PDF download to ensure larger appearance in invoices
    const logoImgs = clone.querySelectorAll('img[alt*="Logo"]');
    logoImgs.forEach(img => {
      img.style.maxWidth = '200px';
      img.style.maxHeight = '200px';
    });
    clone.style.width = element.offsetWidth + 'px';
    clone.style.background = '#ffffff';
    document.body.appendChild(clone);

    // ── Step 2: Pre-convert all images in clone to base64 to bypass CORS
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(images.map((img) => imgToBase64(img)));

    // ── Step 3: Wait for images to finish loading
    await new Promise((r) => setTimeout(r, 200));

    // ── Step 4: Capture with html2canvas
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });

    // Cleanup clone
    document.body.removeChild(clone);

    // ── Step 5: Build PDF
    const imgData = canvas.toDataURL('image/png');
    const A4_W = 210;
    const ratio = canvas.height / canvas.width;
    const pdfW = A4_W;
    const pdfH = pdfW * ratio;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pdfH > 297 ? [A4_W, pdfH] : 'a4',
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('PDF capture failed:', err);
    alert(`Failed to generate PDF: ${err.message || 'Unknown error'}. Please try again.`);
  } finally {
    if (onEnd) onEnd();
  }
}


