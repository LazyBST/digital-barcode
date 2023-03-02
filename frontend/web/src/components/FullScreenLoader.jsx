import { Backdrop, CircularProgress } from "@mui/material";

export const FullScreenLoader = () => {
  return (
    <Backdrop
      sx={{
        backgroundColor: "#fff",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      open={true}
    >
      <CircularProgress />
    </Backdrop>
  );
};
