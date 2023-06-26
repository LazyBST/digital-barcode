import {
  Box,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormLabel,
  Button,
  Checkbox,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

import { UploadError } from "./UploadError";
import { SingleFileUploadWithProgress } from "./SingleFileUploadWithProgress";
import { axiosInstance } from "@/utils";
import axios from "axios";
import { FullScreenLoader } from "./FullScreenLoader";
import { generateZipForFiles } from "@/utils/utils";

let currentId = 0;

function getNewId() {
  return ++currentId;
}

const useStyles = (theme) => ({
  height: "45vh",
  display: "flex",
  outline: "none",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: theme?.shape?.borderRadius,
  background: theme?.palette?.background?.default,
  border: `2px dashed ${theme?.palette?.primary?.main}`,
});

export function MultipleFileUploadField() {
  const [files, setFiles] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [areFilesUploaded, setAreFilesUploaded] = useState(false);
  const [isZipDownload, setIsZipDownload] = useState(true);
  const [barcodePosition, setBarcodePosition] = useState("LEFT");
  const [exportType, setExportType] = useState("PDF");

  const onDrop = useCallback(
    (accFiles, rejFiles) => {
      const mappedAcc = accFiles.map((file) => ({
        file,
        errors: [],
        id: getNewId(),
      }));
      const mappedRej = rejFiles.map((r) => ({ ...r, id: getNewId() }));

      const filesArray = [...files, ...mappedAcc, ...mappedRej];
      setFiles(filesArray);
    },
    [files, setFiles]
  );

  function onUpload(file, url, objectKey) {
    setFiles((curr) =>
      curr.map((fw) => {
        if (fw.file === file) {
          return { ...fw, url, objectKey };
        }
        return fw;
      })
    );
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  const handleBarcodePosition = (event) => {
    setBarcodePosition(event.target.value);
  };

  const handleExportType = (event) => {
    setExportType(event.target.value);
  };

  const onZipDonwloadChange = (event) => {
    const checked = event.target.checked;
    setIsZipDownload(checked);
  };

  const onDownloadAll = useCallback(
    async (files) => {
      setIsDownloading(true);
      const promises = [];
      for (const file of files) {
        const objectKey = file.objectKey;

        const apiCall = axiosInstance
          .post("/barcode", {
            object_key: String(objectKey),
            barcode_position: String(barcodePosition),
            export_type: String(exportType),
            // property: String(process.env.NEXT_PUBLIC_PROPERTY),
          })
          .then((resp) => {
            const data = resp.data;
            const fileName = `${objectKey}.${exportType?.toLowerCase()}`;
            if (!isZipDownload) {
              const link = document.createElement("a");
              link.id = objectKey;
              link.href = data?.url || data?.tiff_url;
              link.target = "_self";
              link.setAttribute("download", fileName);

              // Append to html link element page
              document.body.appendChild(link);

              // Start download
              // setTimeout(() => {
              link.click();
              // Clean up and remove the link
              link.parentNode.removeChild(link);
              // }, 500);
            }
            return {
              name: fileName,
              objectKey: objectKey,
              url: data?.url || data?.tiff_url,
            };
          })
          .catch((err) => {
            console.error(
              `error adding barcode to file ${objectKey} :: ${err}`
            );
            return {
              name: objectKey,
              url: undefined,
            };
          });
        promises.push(apiCall);
      }

      let fileUrls = await Promise.all(promises);
      fileUrls = fileUrls.filter((file) => file.url);

      if (isZipDownload) {
        const filesDataPromise = [];
        for (const file of fileUrls) {
          const apiCall = axios
            .get(file.url, {
              responseType: "arraybuffer",
            })
            .then((resp) => {
              const data = resp.data;
              return {
                ...file,
                blob: data,
              };
            })
            .catch((err) => {
              console.error(
                `error downloadin barcode appended file ${file.name} :: ${err}`
              );
              return {
                ...file,
                blob: undefined,
              };
            });
          filesDataPromise.push(apiCall);
        }
        const filesData = await Promise.all(filesDataPromise);
        await generateZipForFiles(filesData);
      }
      setIsDownloading(false);
    },
    [files, isZipDownload, exportType]
  );

  const onClearAll = useCallback(() => {
    setFiles([]);
  }, [files]);

  useEffect(() => {
    if (files.length && files.every((file) => !!file.objectKey)) {
      setAreFilesUploaded(true);
    } else {
      setAreFilesUploaded(false);
    }
  }, [files]);

  return (
    <React.Fragment>
      {isDownloading ? <FullScreenLoader /> : ""}
      <Grid item>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            p: 1,
            m: 1,
            bgcolor: "background.paper",
            borderRadius: 1,
          }}
        >
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-controlled-open-select-label">
              Barcode Position
            </InputLabel>
            <Select
              labelId="demo-controlled-open-select-label"
              id="demo-controlled-open-select"
              value={barcodePosition}
              label="Barcode Position"
              onChange={handleBarcodePosition}
              sx={{ mb: 2 }}
            >
              <MenuItem value={"LEFT"}>Left</MenuItem>
              <MenuItem value={"RIGHT"}>Right</MenuItem>
              <MenuItem value={"MIDDLE"}>Middle</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-controlled-open-select-export-as">
              Export As
            </InputLabel>
            <Select
              labelId="demo-controlled-open-select-export-as"
              id="demo-controlled-open-select-export-as"
              value={exportType}
              label="Export As"
              onChange={handleExportType}
              sx={{ mb: 2 }}
            >
              <MenuItem value={"TIFF"}>tiff</MenuItem>
              <MenuItem value={"PDF"}>pdf</MenuItem>
            </Select>
          </FormControl>
          <FormControl
            sx={{
              m: 1,
              minWidth: 200,
              ml: "auto",
              display: "flex",
              justifyContent: "space-evenly",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FormLabel>Download as zip</FormLabel>
            <Checkbox
              aria-label="zip-option-checkbox"
              onChange={onZipDonwloadChange}
              checked={isZipDownload}
            />
          </FormControl>
        </Box>
        <Box {...getRootProps()} sx={useStyles}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </Box>
      </Grid>
      {areFilesUploaded ? (
        <>
          <Button
            size="medium"
            style={{ margin: "10px" }}
            variant="contained"
            onClick={() => onDownloadAll(files)}
            disabled={isDownloading}
          >
            Download All
          </Button>

          <Button
            size="medium"
            style={{ margin: "10px" }}
            variant="contained"
            onClick={() => onClearAll()}
            color="info"
            disabled={isDownloading}
          >
            Clear All
          </Button>
        </>
      ) : (
        ""
      )}

      {files.map((fileWrapper) => {
        const isError = Boolean(fileWrapper.errors.length);
        return (
          <Grid item key={fileWrapper.id}>
            {isError ? (
              <UploadError
                file={fileWrapper.file}
                errors={fileWrapper.errors}
                onDelete={onDelete}
              />
            ) : (
              <SingleFileUploadWithProgress
                barcodePosition={barcodePosition}
                onUpload={onUpload}
                file={fileWrapper.file}
                exportType={exportType}
              />
            )}
          </Grid>
        );
      })}
    </React.Fragment>
  );
}
