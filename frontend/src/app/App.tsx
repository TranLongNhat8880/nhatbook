import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "next-themes";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { HomePage } from "./components/HomePage";
import { PostDetailPage } from "./components/PostDetailPage";
import { CreatePostPage } from "./components/CreatePostPage";
import { EditPostPage } from "./components/EditPostPage";
import { ProfilePage } from "./components/ProfilePage";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/admin/posts/new" element={<CreatePostPage />} />
          <Route path="/admin/posts/:id/edit" element={<EditPostPage />} />
          
          {/* Route mặc định chuyển hướng về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
