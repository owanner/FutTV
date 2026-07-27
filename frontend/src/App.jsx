import AppRoutes from "./routes/AppRoutes";
import { Analytics } from "@vercel/analytics/react"

export default function App() {
  return (
    <>
      <AppRoutes />
      <Analytics />
    </>
  );
}