import { ArrowLeft, Menu } from "lucide-react"
import HiveUserAvatarButton from "./HiveUserAvatarButton"
import SidebarDrawer from "./SidebarDrawer"
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
    title: string;
    isDrawerMenuRequired: boolean;
}

export function Header({
    title, isDrawerMenuRequired
}: HeaderProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const navigate = useNavigate();
    return (
        <>
            <div className="navbar bg-background shadow-sm border-b border-border">
                <div className="flex-1 flex items-center">
                    {/* Drawer Menu Button */}
                    {isDrawerMenuRequired ?
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="p-2 hover:bg-accent rounded-full mr-3"
                        >
                            <Menu className="w-6 h-6 text-foreground" />
                        </button>
                        : <button
                            onClick={() => navigate("/")}
                            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20 cursor-pointer px-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    }

                    <h1 className="text-xl font-bold text-foreground">{title}</h1>
                </div>
                <div className="flex-none">
                    <HiveUserAvatarButton />
                </div>
            </div>
            {/* Sidebar Drawer */}
            {
                isDrawerMenuRequired && (<SidebarDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                />)
            }

        </>
    )
}

export default Header