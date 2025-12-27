import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

const page = async() => {
  const session = await auth()
  if (!session) redirect ("/auth/sign-in")
  return (
    <div className='flex items-center justify-center h-screen'>
      <h1 className='text-2xl font-bold'>Hello User you're welcome to our pos software</h1>
    </div>
  )
}

export default page