import { Box, Grid, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

import { UploadError } from "./UploadError";
import { SingleFileUploadWithProgress } from "./SingleFileUploadWithProgress";

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

  function onUpload(file, url) {
    setFiles((curr) =>
      curr.map((fw) => {
        if (fw.file === file) {
          return { ...fw, url };
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

  const [barcodePosition, setBarcodePosition] = useState("LEFT");
  const [exportType, setExportType] = useState("TIFF");

  const handleBarcodePosition = (event) => {
    setBarcodePosition(event.target.value);
  };

  const handleExportType = (event) => {
    setExportType(event.target.value);
  };

  return (
    <React.Fragment>
      <Grid item>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              p: 1,
              m: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
            }}
          >
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="demo-controlled-open-select-label">Barcode Position</InputLabel>
                <Select
                  labelId="demo-controlled-open-select-label"
                  id="demo-controlled-open-select"
                  value={barcodePosition}
                  label="Barcode Position"
                  onChange={handleBarcodePosition}
                  sx={{mb: 2}}
                >
                  <MenuItem value={"LEFT"}>Left</MenuItem>
                  <MenuItem value={"RIGHT"}>Right</MenuItem>
                  <MenuItem value={"MIDDLE"}>Middle</MenuItem>
                </Select>
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="demo-controlled-open-select-export-as">Export As</InputLabel>
                <Select
                  labelId="demo-controlled-open-select-export-as"
                  id="demo-controlled-open-select-export-as"
                  value={exportType}
                  label="Export As"
                  onChange={handleExportType}
                  sx={{mb: 2}}
                >
                  <MenuItem value={"TIFF"}>tiff</MenuItem>
                  <MenuItem value={"PDF"}>pdf</MenuItem>
                </Select>
            </FormControl>
          </Box>
        <Box {...getRootProps()} sx={useStyles}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </Box>
      </Grid>

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
