import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatUnreadProvider } from "./context/ChatUnreadContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";
import EmployeeProfile from "./pages/EmployeeProfile";
import Leaves from "./pages/Leaves";
import Certificates from "./pages/Certificates";
import Appraisals from "./pages/Appraisals";
import Assets from "./pages/Assets";
import Approvals from "./pages/Approvals";
import ESupport from "./pages/ESupport";
import Support247 from "./pages/Support247";
import LeadershipLine from "./pages/LeadershipLine";
import Roster from "./pages/Roster";
import Reports from "./pages/Reports";
import SkillMatrix from "./pages/SkillMatrix";
import Chat from "./pages/Chat";
import Leaderboard from "./pages/Leaderboard";
import TeamPerformance from "./pages/TeamPerformance";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatUnreadProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/leaves" element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
          <Route path="/appraisals" element={<ProtectedRoute><Appraisals /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute roles={["hr", "lead", "teamlead", "superadmin"]}><Approvals /></ProtectedRoute>} />
          <Route path="/esupport" element={<ProtectedRoute><ESupport /></ProtectedRoute>} />
          <Route path="/support247" element={<ProtectedRoute><Support247 /></ProtectedRoute>} />
          <Route path="/leadershipline" element={<ProtectedRoute><LeadershipLine /></ProtectedRoute>} />
          <Route path="/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/skillmatrix" element={<ProtectedRoute><SkillMatrix /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/performance" element={<ProtectedRoute roles={["hr", "lead", "teamlead", "superadmin"]}><TeamPerformance /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={["hr", "lead", "superadmin"]}><Users /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
        </Routes>
        </ChatUnreadProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
