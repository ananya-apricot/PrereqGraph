import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import { Loading } from '../components/Page.jsx'
import Login from '../pages/Login.jsx'
import Register from '../pages/Register.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import SubjectExplorer from '../pages/SubjectExplorer.jsx'
import GraphExplorer from '../pages/GraphExplorer.jsx'
import DiagnosticQuiz from '../pages/DiagnosticQuiz.jsx'
import LearningPath from '../pages/LearningPath.jsx'
import Profile from '../pages/Profile.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? children : <Navigate to="/login" replace />
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Navigate to="/" replace /> : children
}

export default function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/subjects" element={<Protected><SubjectExplorer /></Protected>} />
        <Route path="/subjects/:subjectId" element={<Protected><SubjectExplorer /></Protected>} />
        <Route path="/graph/:subjectId" element={<Protected><GraphExplorer /></Protected>} />
        <Route path="/quiz/:conceptId" element={<Protected><DiagnosticQuiz /></Protected>} />
        <Route path="/path" element={<Protected><LearningPath /></Protected>} />
        <Route path="/path/:targetId" element={<Protected><LearningPath /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
