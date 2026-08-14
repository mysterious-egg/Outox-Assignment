import { Navigate, Route, Routes } from "react-router-dom";
import ComposePage from "./pages/ComposePage";
import LoginPage from "./pages/LoginPage";
import ScheduledPage from "./pages/ScheduledPage";
import SentPage from "./pages/SentPage";
import EmailDetailPage from "./pages/EmailDetailPage";
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/scheduled" element={<ScheduledPage />} />
      <Route path="/sent" element={<SentPage />} />
      <Route path="/compose" element={<ComposePage />} />
      <Route path="/emails/:id" element={<EmailDetailPage />} />

      <Route
        path="/"
        element={<Navigate to="/scheduled" replace />}
      />
    </Routes>
  );
}

export default App;