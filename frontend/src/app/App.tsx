import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "next-themes";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { HomePage } from "./components/HomePage";
import { PostDetailPage } from "./components/PostDetailPage";
import { CreatePostPage } from "./components/CreatePostPage";
import { EditPostPage } from "./components/EditPostPage";
import { ProfilePage } from "./components/ProfilePage";
import { PublicProfilePage } from "./components/PublicProfilePage";
import { ShopPage } from "./components/ShopPage";
import { LeaderboardPage } from "./components/LeaderboardPage";
import { MainLayout } from "./components/MainLayout";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user/:id" element={<PublicProfilePage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="/admin/posts/new" element={<CreatePostPage />} />
            <Route path="/admin/posts/:id/edit" element={<EditPostPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            
            {/* Route mặc định chuyển hướng về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
