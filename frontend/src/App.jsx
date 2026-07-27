import AppRoutes from "./routes/AppRoutes";
import { Analytics } from "@vercel/analytics/next"

export default function App() {
  return (
    <>
      <AppRoutes />
      <Analytics />
    </>
  );
}