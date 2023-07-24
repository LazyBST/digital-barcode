import axios from "axios";
import React, { useEffect, useState } from "react";
import { Grid, LinearProgress } from "@mui/material";

import { axiosInstance } from "@/utils";
import { FileHeader } from "./FileHeader";

export function SingleFileUploadWithProgress({
  file,
  onUpload,
  barcodePosition,
  exportType,
  isAddPrefix,
}) {
  const [progress, setProgress] = useState(0);
  const [objectKey, setObjectKey] = useState();
  const [downloading, setDownloading] = useState(false);

  const onDownload = async () => {
    // Write on download function using objectKey
    setDownloading(true);
    const payload = {
      object_key: String(objectKey),
      barcode_position: String(barcodePosition),
      export_type: String(exportType),
    };

    if (isAddPrefix) {
      payload.property = String(process.env.NEXT_PUBLIC_PROPERTY);
    }

    const { data } = await axiosInstance.post("/barcode", payload);

    const link = document.createElement("a");
    link.href = data.tiff_url;
    link.setAttribute("download", `${objectKey}.${exportType?.toLowerCase()}`);

    // Append to html link element page
    document.body.appendChild(link);

    // Start download
    setTimeout(() => {
      link.click();
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      setDownloading(false);
    }, 500);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();

    async function upload() {
      try {
        let endpoint = `/signedURL`;

        if (isAddPrefix) {
          endpoint += `?property=${process.env.NEXT_PUBLIC_PROPERTY}`;
        }

        const { data } = await axiosInstance.get(endpoint, {
          cancelToken: cancelTokenSource.token,
        });
        const { object_key, upload_url: uploadUrl } = data;

        const url = await uploadFile(uploadUrl, file, setProgress);

        // Set Object key
        setObjectKey(object_key);
        // Call barcode API to download tiff file using the download Button

        onUpload(file, url, object_key);
      } catch (error) {}
    }

    upload();

    return () => {
      cancelTokenSource.cancel();
    };
  }, []);

  return (
    <Grid item>
      <FileHeader
        file={file}
        onDownload={onDownload}
        disableDownload={downloading}
      />
      <LinearProgress variant="determinate" value={progress} />
    </Grid>
  );
}

function uploadFile(uploadUrl, file, onProgress) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    xhr.onload = () => {
      //   const resp = JSON.parse(xhr.responseText);
      //   res(resp);
      res({});
    };
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.onerror = (evt) => rej(evt);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = (event.loaded / event.total) * 100;
        onProgress(Math.round(percentage));
      }
    };

    const formData = new FormData();
    formData.append("file", file);

    xhr.send(formData);
  });
}
