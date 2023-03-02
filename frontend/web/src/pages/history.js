import { Layout } from "@/Layout";
import { Box } from "@mui/material";

export default function History() {
  return <Box sx={{ textAlign: "center" }}>History Will be here!!</Box>;
}

History.getLayout = function (page) {
  return <Layout>{page}</Layout>;
};
