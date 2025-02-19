// src/shared/getFilePath.ts
type IFolderName = 'image' | 'media' | 'doc' | 'images' | 'media' | 'docs';

export const getFilePathMultiple = (
  files: any,
  fieldname: string,
  folderName: IFolderName
): string[] | undefined => {
  if (!files || !files[fieldname]) {
    return undefined;
  }

  return files[fieldname].map(
    (file: any) => `/${folderName}s/${file.filename}`
  );
};

const getFilePath = (files: any, folderName: IFolderName): string | null => {
  if (!files || !('image' in files) || !files.image[0]) {
    return null;
  }

  return `/${folderName}/${files.image[0].filename}`;
};

export default getFilePath;
