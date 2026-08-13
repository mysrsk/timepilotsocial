import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Workspace from "@/pages/Workspace";
import { Route, Switch } from "wouter";

function Router() { return <Switch><Route path="/" component={Home}/><Route path="/app">{()=><DashboardLayout><Workspace/></DashboardLayout>}</Route><Route path="/calendar">{()=><DashboardLayout><Workspace/></DashboardLayout>}</Route><Route path="/library">{()=><DashboardLayout><Workspace/></DashboardLayout>}</Route><Route path="/accounts">{()=><DashboardLayout><Workspace/></DashboardLayout>}</Route><Route path="/settings">{()=><DashboardLayout><Workspace/></DashboardLayout>}</Route><Route path="/404" component={NotFound}/><Route component={NotFound}/></Switch>; }
function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right"/><Router/></TooltipProvider></ThemeProvider></ErrorBoundary>; }
export default App;
