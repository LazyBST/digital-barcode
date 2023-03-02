import axios from "axios";
import React, { useEffect, useState } from "react";
import { Grid, LinearProgress } from "@mui/material";

import { axiosInstance } from "@/utils";
import { FileHeader } from "./FileHeader";

export function SingleFileUploadWithProgress({ file, onUpload }) {
  const [progress, setProgress] = useState(0);
  const [objectKey, setObjectKey] = useState();

  const onDownload = () => {
    // Write on download function using objectKey
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();

    async function upload() {
      try {
        const { data } = await axiosInstance.get("/signedURL", {
          cancelToken: cancelTokenSource.token,
        });
        const { object_key, upload_url: uploadUrl } = data;

        const url = await uploadFile(uploadUrl, file, setProgress);

        // Set Object key
        setObjectKey(object_key);
        // Call barcode API to download tiff file using the download Button

        onUpload(file, url);
      } catch (error) {}
    }

    upload();

    return () => {
      cancelTokenSource.cancel();
    };
  }, []);

  return (
    <Grid item>
      <FileHeader file={file} onDownload={onDownload} />
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
