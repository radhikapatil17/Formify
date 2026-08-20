import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="#FAFAFA"
          p={3}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 600,
              width: "100%",
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              textAlign: "center",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
            }}
          >
            <Typography variant="h5" fontWeight={800} color="error.main" mb={1}>
              Render Exception Caught
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              An unexpected runtime error occurred in this view component.
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 2,
                textAlign: "left",
                mb: 3,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              <Typography variant="caption" fontFamily="monospace" color="#DC2626" sx={{ wordBreak: "break-word" }}>
                {this.state.error?.toString()}
              </Typography>
            </Box>
            <Button variant="contained" color="primary" onClick={this.handleReload}>
              Reload Application
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
