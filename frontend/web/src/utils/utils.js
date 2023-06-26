import JSZip from "jszip";
import { saveAs } from "file-saver";

export const generateZipForFiles = async (files) => {
  let filename = Date.now();
  const zip = new JSZip();
  files.forEach((file) => {
    const name = file.name;
    const blob = file.blob;
    if (blob) {
      zip.file(name, blob);
    }
  });

  await zip
    .generateAsync({ type: "blob" })
    .then((blob) => saveAs(blob, filename))
    .catch((e) => console.log(`error downloading the zip :: ${e}`));
};
