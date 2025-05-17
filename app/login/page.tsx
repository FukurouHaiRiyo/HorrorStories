import { Suspense } from "react"
import LoginPage from "./login-content" // or wherever your component is

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>Loading login...</div>}>
      <LoginPage />
    </Suspense>
  )
}
