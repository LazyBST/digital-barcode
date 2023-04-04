import * as React from "react";
import { Auth } from "aws-amplify";
import List from "@mui/material/List";
import { Box, Button } from "@mui/material";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import CssBaseline from "@mui/material/CssBaseline";
import LogoutIcon from "@mui/icons-material/Logout";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HistoryIcon from "@mui/icons-material/History";
import ListItemButton from "@mui/material/ListItemButton";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import { AppBar } from "./Appbar";
import { SideBar, SidebarHeader } from "./Sidebar";
import { useRouter } from "next/router";
import Link from "next/link";

export function Layout({ children }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" noWrap component="div">
              Digital Barcode
            </Typography>

            <Button
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={() => Auth.signOut().then(() => router.push("/login"))}
            >
              Log out!
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <SideBar
        open={open}
        variant="permanent"
        onMouseEnter={handleDrawerOpen}
        onMouseLeave={handleDrawerClose}
      >
        <SidebarHeader>
          <img src="https://ennovatech.com/assets/images/company-logo/hotlync.svg" alt="Hotlync" width="100%"/>
        </SidebarHeader>
        <Divider />
        <List>
          <Link href="/" style={{ all: "unset" }}>
            <ListItem disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  <FileUploadIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"Upload Files"}
                  sx={{ opacity: open ? 1 : 0 }}
                />
              </ListItemButton>
            </ListItem>
          </Link>

          {/*<Link href="/history" style={{ all: "unset" }}>
            <ListItem disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"History"}
                  sx={{ opacity: open ? 1 : 0 }}
                />
              </ListItemButton>
            </ListItem>
                </Link>*/}
        </List>
      </SideBar>
      <Box component="main" sx={{ flexGrow: 1, p: 1 }}>
        <SidebarHeader />
        {children}
      </Box>
    </Box>
  );
}
