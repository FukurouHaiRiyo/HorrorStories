import { MainNav } from "@/components/main-nav"
import ClientWrapper from "./client-wrapper"

export default function DatabaseOptimizationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <ClientWrapper />
      </main>
    </div>
  )
}
