import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function LogoutButton() {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
            
            // Clear localStorage to prevent data leakage between users
            localStorage.clear();

            // Redirect to login page
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout error:", error);
            alert("Erro ao fazer logout. Tente novamente.");
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20"
        >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair</span>
        </button>
    );
}
