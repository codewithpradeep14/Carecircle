import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-1">Sign in to your CareCircle account</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border-0 p-0 bg-transparent",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton: "w-full",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
            footerAction: "text-center",
          },
        }}
      />
    </div>
  )
}
