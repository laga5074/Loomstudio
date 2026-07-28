import JSZip from 'jszip';
import { EXTENSION_FILES } from '../data/extensionCode';

export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();

  // Create root folder inside zip
  const extensionFolder = zip.folder('localloom-extension');

  if (!extensionFolder) return;

  EXTENSION_FILES.forEach((file) => {
    extensionFolder.file(file.path, file.content);
  });

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Trigger download in browser
  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'localloom-chrome-extension.zip';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
