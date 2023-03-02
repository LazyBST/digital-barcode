import { Button, Grid } from "@mui/material";

export function FileHeader({ file, onDownload, disableDownload }) {
  return (
    <Grid
      container
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Grid item>{file.name}</Grid>
      <Grid item>
        <Button
          size="small"
          disabled={disableDownload}
          onClick={() => onDownload(file)}
        >
          Download
        </Button>
      </Grid>
    </Grid>
  );
}
