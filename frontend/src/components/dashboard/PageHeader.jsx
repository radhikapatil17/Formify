import { Box, Typography } from "@mui/material";

export default function PageHeader() {
  return (
    <Box mb={4}>
      <Typography
        variant="h4"
        fontWeight={700}
      >
        Welcome Back 👋
      </Typography>

      <Typography
        color="text.secondary"
        mt={1}
      >
        Here's an overview of your Smart Form Builder.
      </Typography>
    </Box>
  );
}