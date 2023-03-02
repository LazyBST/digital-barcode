import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Auth } from "aws-amplify";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

export default function Login() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  //   const location = useLocation();
  //   const navigate = useNavigate();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  //   const from = location.state?.from?.pathname || ROUTE_NAMES.HOME;

  const onLogin = async (data) => {
    setLoading(true);
    try {
      await Auth.signIn({
        username: data.username,
        password: data.password,
      });

      // const session = await Auth.currentSession();
      // localStorage.setItem(
      //   AUTH_USER_TOKEN_KEY,
      //   session.getAccessToken().getJwtToken()
      // );
      setLoading(false);
      router.push("/");
      //   navigate(from, { replace: true });
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* <img src={appLogo} alt="Logo" /> */}
        <Typography component="h1" variant="h5" sx={{ mt: 2 }}>
          Sign in
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit(onLogin)}
          noValidate
          sx={{ mt: 1 }}
        >
          <TextField
            margin="normal"
            fullWidth
            id="username"
            label="UserName"
            autoComplete="username"
            autoFocus
            {...register("username", { required: true })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Password"
            type="password"
            id="password"
            {...register("password", { required: true })}
            autoComplete="current-password"
          />
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? "Signing in.." : "Sign In"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
