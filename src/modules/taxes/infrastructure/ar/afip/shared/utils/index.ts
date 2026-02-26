import { unlink } from 'fs/promises';

export const cleanupTmpLink = async (outputPath: string) => {
  try {
    await unlink(outputPath);
  } catch (error) {
    console.warn(`No se pudo eliminar el archivo temporal: ${outputPath}`, error);
  }
};
