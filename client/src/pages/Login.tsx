import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "@/hooks/Login/useLogin"
import { AlertCircle, ArrowRight, Loader2, Users } from "lucide-react"

function Login() {
    const {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        handleLogin
    } = useLogin();

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 bg-background overflow-hidden selection:bg-primary/20">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-10000" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/30 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-7000 delay-1000" />
            </div>

            <div className="z-10 w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20 ring-1 ring-white/10">
                        <Users className="h-8 w-8 text-primary-foreground drop-shadow-md" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                            NexusHR
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            The human capital platform
                        </p>
                    </div>
                </div>

                <Card className="border-border/40 shadow-2xl shadow-black/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                    <CardHeader className="space-y-2 pb-6">
                        <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
                        <CardDescription className="text-base">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin}>
                            <div className="flex flex-col gap-5">
                                {error && (
                                    <div className="bg-destructive/10 text-destructive text-sm p-3.5 rounded-lg flex items-start gap-2.5 border border-destructive/20 animate-in slide-in-from-top-2">
                                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                        <span className="font-medium leading-relaxed">{error}</span>
                                    </div>
                                )}
                                <div className="space-y-2.5">
                                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11 px-4 bg-muted/40 border-border/50 focus:bg-background transition-colors placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                        <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                            Forgot password?
                                        </a>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11 px-4 bg-muted/40 border-border/50 focus:bg-background transition-colors placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col items-center justify-center pt-6 pb-6">
                        <p className="text-sm text-muted-foreground text-center">
                            By clicking continue, you agree to our <br className="hidden sm:inline" />
                            <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Privacy Policy</a>.
                        </p>
                    </CardFooter>
                </Card>
            </div>

            {/* Global Loader Overlay if needed, though form button is better */}
        </div>
    )
}

export default Login