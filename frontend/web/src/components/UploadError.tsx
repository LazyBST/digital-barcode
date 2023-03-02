import React from "react";
import { FileHeader } from "./FileHeader";
import { FileError } from "react-dropzone";
import { styled } from "@mui/material/styles";
import { LinearProgress, Typography } from "@mui/material";

export interface UploadErrorProps {
  file: File;
  onDelete: (file: File) => void;
  errors: FileError[];
}

const ErrorLinearProgress = styled(
  LinearProgress,
  {}
)(({ theme }) => ({
  bar: {
    backgroundColor: theme.palette.error.main,
  },
}));

export function UploadError({ file, onDelete, errors }: UploadErrorProps) {
  return (
    <React.Fragment>
      <FileHeader file={file} onDelete={onDelete} />
      <ErrorLinearProgress variant="determinate" value={100} />
      {errors.map((error) => (
        <div key={error.code}>
          <Typography color="error">{error.message}</Typography>
        </div>
      ))}
    </React.Fragment>
  );
}
