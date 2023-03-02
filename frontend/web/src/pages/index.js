import * as React from "react";
import { Layout } from "@/Layout";
import { Card, CardContent, Grid } from "@mui/material";
import { MultipleFileUploadField } from "@/components/MultipleFileUploadField";

export default function Home() {
  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} direction="column">
          <MultipleFileUploadField />
        </Grid>
      </CardContent>
    </Card>
  );
}

Home.getLayout = function (page) {
  return <Layout>{page}</Layout>;
};
