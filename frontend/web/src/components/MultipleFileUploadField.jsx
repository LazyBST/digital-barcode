import { Box, Grid } from "@mui/material";
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

  return (
    <React.Fragment>
      <Grid item>
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
                onUpload={onUpload}
                file={fileWrapper.file}
              />
            )}
          </Grid>
        );
      })}
    </React.Fragment>
  );
}
